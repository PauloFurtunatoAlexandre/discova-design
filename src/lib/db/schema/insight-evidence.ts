import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { insightCards } from "./insight-cards";
import { quotes } from "./quotes";

export const insightEvidence = pgTable(
	"insight_evidence",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		insightId: uuid("insight_id")
			.notNull()
			.references(() => insightCards.id, { onDelete: "cascade" }),
		quoteId: uuid("quote_id")
			.notNull()
			.references(() => quotes.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("insight_evidence_unique").on(table.insightId, table.quoteId),
		index("insight_evidence_quote_idx").on(table.quoteId),
	],
);
