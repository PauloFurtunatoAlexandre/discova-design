import { sql } from "drizzle-orm";
import { boolean, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const researchNotes = pgTable(
	"research_notes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		participantName: text("participant_name").notNull(),
		sessionDate: date("session_date").notNull().default(sql`CURRENT_DATE`),
		rawContent: text("raw_content").notNull(),
		researchMethod: text("research_method", {
			enum: ["interview", "survey", "usability_test", "observation", "other"],
		}),
		userSegment: text("user_segment"),
		emotionalTone: text("emotional_tone", {
			enum: ["frustrated", "delighted", "neutral", "mixed"],
		}),
		assumptionsTested: text("assumptions_tested"),
		followUpNeeded: boolean("follow_up_needed").notNull().default(false),
		sessionRecordingUrl: text("session_recording_url"),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
		searchVector: text("search_vector"),
	},
	(table) => [
		index("research_notes_project_idx").on(table.projectId),
		index("research_notes_created_by_idx").on(table.createdBy),
		index("research_notes_project_date_idx").on(table.projectId, table.sessionDate),
		index("research_notes_method_idx").on(table.researchMethod),
		index("research_notes_follow_up_idx").on(table.followUpNeeded),
	],
);
