import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: timestamp("email_verified", { withTimezone: true }),
		image: text("image"),
		passwordHash: text("password_hash"),
		jobTitle: text("job_title"),
		avatarUrl: text("avatar_url"),
		globalPreset: text("global_preset", {
			enum: ["researcher", "pm", "member"],
		}),
		lockedUntil: timestamp("locked_until", { withTimezone: true }),
		failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [uniqueIndex("users_email_idx").on(table.email)],
);
