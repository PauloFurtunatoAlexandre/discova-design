import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { researchNotes } from "./research-notes";
import { users } from "./users";

export const quotes = pgTable(
	"quotes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		noteId: uuid("note_id")
			.notNull()
			.references(() => researchNotes.id, { onDelete: "cascade" }),
		text: text("text").notNull(),
		startOffset: integer("start_offset").notNull(),
		endOffset: integer("end_offset").notNull(),
		isStale: boolean("is_stale").notNull().default(false),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("quotes_note_idx").on(table.noteId)],
);
