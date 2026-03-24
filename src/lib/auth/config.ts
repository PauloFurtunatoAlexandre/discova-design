import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { loginSchema } from "@/lib/validations/auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: DrizzleAdapter(db),

	session: {
		strategy: "database",
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
			allowDangerousEmailAccountLinking: true,
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
		async session({ session, user }) {
			if (session.user && user.id) {
				session.user.id = user.id;
			}
			return session;
		},
	},

	events: {
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
