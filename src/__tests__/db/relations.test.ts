import * as relations from "@/lib/db/schema";
import { describe, expect, it } from "vitest";

describe("Database Relations", () => {
	it("exports all relation definitions", () => {
		expect(relations.usersRelations).toBeDefined();
		expect(relations.workspacesRelations).toBeDefined();
		expect(relations.workspaceMembersRelations).toBeDefined();
		expect(relations.projectsRelations).toBeDefined();
		expect(relations.projectMembersRelations).toBeDefined();
		expect(relations.researchNotesRelations).toBeDefined();
		expect(relations.tagsRelations).toBeDefined();
		expect(relations.noteTagsRelations).toBeDefined();
		expect(relations.quotesRelations).toBeDefined();
		expect(relations.insightCardsRelations).toBeDefined();
		expect(relations.insightEvidenceRelations).toBeDefined();
		expect(relations.mapNodesRelations).toBeDefined();
		expect(relations.mapConnectionsRelations).toBeDefined();
		expect(relations.stackItemsRelations).toBeDefined();
		expect(relations.stackSnapshotsRelations).toBeDefined();
		expect(relations.commentsRelations).toBeDefined();
		expect(relations.notificationsRelations).toBeDefined();
		expect(relations.integrationsRelations).toBeDefined();
		expect(relations.auditLogRelations).toBeDefined();
	});
});
