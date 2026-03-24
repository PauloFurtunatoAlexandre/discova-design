"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { signIn } from "@/lib/auth/config";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { users, workspaceMembers, workspaces } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import slugify from "slugify";

type ActionResult = {
	success?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[]>;
};

async function getClientIp(): Promise<string> {
	const headerStore = await headers();
	return (
		headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
		headerStore.get("x-real-ip") ??
		"unknown"
	);
}

function generateWorkspaceSlug(name: string): string {
	const base = slugify(name, { lower: true, strict: true, trim: true });
	return `${base}-${nanoid(4)}`;
}

export async function signupAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
	try {
		const ip = await getClientIp();
		const { allowed } = checkRateLimit(`signup:${ip}`, {
			maxAttempts: 5,
			windowMs: 60_000,
		});
		if (!allowed) {
			return { error: "Too many signup attempts. Please try again in a minute." };
		}

		const raw = {
			name: formData.get("name"),
			email: formData.get("email"),
			password: formData.get("password"),
		};

		const parsed = signupSchema.safeParse(raw);
		if (!parsed.success) {
			return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
		}

		const { name, email, password } = parsed.data;

		const existing = await db.query.users.findFirst({
			where: eq(users.email, email),
		});
		if (existing) {
			return { error: "Unable to create account. Please try a different email." };
		}

		const passwordHash = await bcrypt.hash(password, 12);

		const [newUser] = await db
			.insert(users)
			.values({ name, email, passwordHash })
			.returning({ id: users.id });

		if (!newUser) {
			return { error: "Failed to create account. Please try again." };
		}

		const workspaceName = `${name}'s Workspace`;
		const workspaceSlug = generateWorkspaceSlug(workspaceName);

		const [workspace] = await db
			.insert(workspaces)
			.values({
				name: workspaceName,
				slug: workspaceSlug,
				createdBy: newUser.id,
			})
			.returning({ id: workspaces.id });

		if (!workspace) {
			return { error: "Failed to create workspace. Please try again." };
		}

		await db.insert(workspaceMembers).values({
			workspaceId: workspace.id,
			userId: newUser.id,
			tier: "admin",
			workspacePreset: "member",
			invitedBy: newUser.id,
			inviteAcceptedAt: new Date(),
		});

		await createAuditEntry({
			workspaceId: workspace.id,
			userId: newUser.id,
			action: "auth.signup",
			targetType: "user",
			targetId: newUser.id,
			metadata: { workspaceId: workspace.id },
			ipAddress: ip,
		});

		return { success: true };
	} catch (err) {
		logger.error({ err }, "Signup action failed");
		return { error: "An unexpected error occurred. Please try again." };
	}
}

export async function loginAction(_prevState: unknown, formData: FormData): Promise<ActionResult> {
	try {
		const ip = await getClientIp();

		const { allowed } = checkRateLimit(`login:${ip}`, {
			maxAttempts: 5,
			windowMs: 60_000,
		});
		if (!allowed) {
			return { error: "Too many login attempts. Please try again in a minute." };
		}

		const raw = {
			email: formData.get("email"),
			password: formData.get("password"),
		};

		const parsed = loginSchema.safeParse(raw);
		if (!parsed.success) {
			return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
		}

		await signIn("credentials", {
			email: parsed.data.email,
			password: parsed.data.password,
			redirect: false,
		});

		return { success: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : "";
		if (
			message.includes("CredentialsSignin") ||
			message.includes("credentials") ||
			message.includes("Invalid")
		) {
			return { error: "Invalid email or password." };
		}

		logger.error({ err }, "Login action failed");
		return { error: "An unexpected error occurred. Please try again." };
	}
}

export async function logoutAction(): Promise<void> {
	const { signOut } = await import("@/lib/auth/config");
	await signOut({ redirect: false });
}
