import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import {
	accounts,
	sessions,
	users,
	verificationTokens,
	workspaceMembers,
	workspaces,
} from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validations/auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import slugify from "slugify";

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),

	session: {
		// NOTE: Auth.js v5 credentials provider always uses JWT internally,
		// regardless of strategy setting. JWT strategy is required for credentials to work.
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60,
		updateAge: 24 * 60 * 60,
	},

	pages: {
		signIn: "/login",
		newUser: "/onboarding",
	},

	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
		}),

		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const parsed = loginSchema.safeParse(credentials);
				if (!parsed.success) return null;

				const { email, password } = parsed.data;

				const user = await db.query.users.findFirst({
					where: eq(users.email, email),
				});

				if (!user || !user.passwordHash) return null;

				if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
					logger.warn({ email }, "Login attempt on locked account");
					return null;
				}

				const isValid = await bcrypt.compare(password, user.passwordHash);

				if (!isValid) {
					const newCount = (user.failedLoginAttempts ?? 0) + 1;
					const updates: Partial<typeof users.$inferInsert> = {
						failedLoginAttempts: newCount,
					};

					if (newCount >= 10) {
						updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
						logger.warn({ email, attempts: newCount }, "Account locked due to failed attempts");
					}

					await db.update(users).set(updates).where(eq(users.id, user.id));
					return null;
				}

				if (user.failedLoginAttempts > 0) {
					await db
						.update(users)
						.set({ failedLoginAttempts: 0, lockedUntil: null })
						.where(eq(users.id, user.id));
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
				};
			},
		}),
	],

	callbacks: {
		async jwt({ token, user }) {
			if (user?.id) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (token.id) {
				session.user.id = token.id as string;
			}
			return session;
		},
	},

	events: {
		async createUser({ user }) {
			// Create a workspace for every new OAuth user (credentials users get
			// their workspace created in signupAction before they ever reach here)
			if (!user.id || !user.email) return;

			const existing = await db.query.workspaceMembers.findFirst({
				where: eq(workspaceMembers.userId, user.id),
			});
			if (existing) return; // workspace already set up

			const workspaceName = user.name ? `${user.name}'s Workspace` : "My Workspace";
			const base = slugify(workspaceName, { lower: true, strict: true, trim: true }) || "workspace";
			const workspaceSlug = `${base}-${nanoid(4)}`;

			const [workspace] = await db
				.insert(workspaces)
				.values({ name: workspaceName, slug: workspaceSlug, createdBy: user.id })
				.returning({ id: workspaces.id });

			if (workspace) {
				await db.insert(workspaceMembers).values({
					workspaceId: workspace.id,
					userId: user.id,
					tier: "admin",
					workspacePreset: "member",
					invitedBy: user.id,
					inviteAcceptedAt: new Date(),
				});
			}
		},

		async signIn({ user, account }) {
			logger.info({ userId: user.id, provider: account?.provider }, "User signed in");
			if (user.id) {
				await createAuditEntry({
					userId: user.id,
					action: "auth.signin",
					targetType: "user",
					targetId: user.id,
					metadata: { provider: account?.provider },
				});
			}
		},

		async signOut(message) {
			const userId = "session" in message ? message.session?.userId : undefined;
			if (userId) {
				logger.info({ userId }, "User signed out");
				await createAuditEntry({
					userId,
					action: "auth.signout",
					targetType: "user",
					targetId: userId,
				});
			}
		},
	},
});
