CREATE INDEX IF NOT EXISTS "note_tags_tag_idx" ON "note_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_cards_project_author_idx" ON "insight_cards" USING btree ("project_id","created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "insight_evidence_quote_idx" ON "insight_evidence" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_user_idx" ON "audit_log" USING btree ("user_id");