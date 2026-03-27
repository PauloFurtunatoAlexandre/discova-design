import { index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { researchNotes } from "./research-notes";
import { tags } from "./tags";

export const noteTags = pgTable(
	"note_tags",
	{
		noteId: uuid("note_id")
			.notNull()
			.references(() => researchNotes.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.noteId, table.tagId] }),
		index("note_tags_tag_idx").on(table.tagId),
	],
);
