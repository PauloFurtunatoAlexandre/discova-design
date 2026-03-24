import * as schema from "@/lib/db/schema";
import { describe, expect, it } from "vitest";

describe("Database Schema", () => {
	it("exports all expected tables", () => {
		expect(schema.users).toBeDefined();
		expect(schema.workspaces).toBeDefined();
		expect(schema.workspaceMembers).toBeDefined();
		expect(schema.projects).toBeDefined();
		expect(schema.projectMembers).toBeDefined();
		expect(schema.researchNotes).toBeDefined();
		expect(schema.tags).toBeDefined();
		expect(schema.noteTags).toBeDefined();
		expect(schema.quotes).toBeDefined();
		expect(schema.insightCards).toBeDefined();
		expect(schema.insightEvidence).toBeDefined();
		expect(schema.mapNodes).toBeDefined();
		expect(schema.mapConnections).toBeDefined();
		expect(schema.stackItems).toBeDefined();
		expect(schema.stackSnapshots).toBeDefined();
		expect(schema.comments).toBeDefined();
		expect(schema.notifications).toBeDefined();
		expect(schema.integrations).toBeDefined();
		expect(schema.auditLog).toBeDefined();
	});

	it("exports auth tables", () => {
		expect(schema.accounts).toBeDefined();
		expect(schema.sessions).toBeDefined();
		expect(schema.verificationTokens).toBeDefined();
	});

	it("users table has correct columns", () => {
		const columns = Object.keys(schema.users);
		expect(columns).toContain("id");
		expect(columns).toContain("email");
		expect(columns).toContain("name");
		expect(columns).toContain("globalPreset");
		expect(columns).toContain("passwordHash");
		expect(columns).toContain("failedLoginAttempts");
		expect(columns).toContain("lockedUntil");
	});

	it("workspace_members table has tier and preset fields", () => {
		const columns = Object.keys(schema.workspaceMembers);
		expect(columns).toContain("tier");
		expect(columns).toContain("workspacePreset");
		expect(columns).toContain("removedAt");
		expect(columns).toContain("inviteAcceptedAt");
	});

	it("stack_items table has RICE fields and integration estimates", () => {
		const columns = Object.keys(schema.stackItems);
		expect(columns).toContain("reachAuto");
		expect(columns).toContain("reachOverride");
		expect(columns).toContain("impactAuto");
		expect(columns).toContain("impactOverride");
		expect(columns).toContain("confidenceAuto");
		expect(columns).toContain("confidenceOverride");
		expect(columns).toContain("effortManual");
		expect(columns).toContain("effortJiraEstimate");
		expect(columns).toContain("effortLinearEstimate");
		expect(columns).toContain("riceScore");
		expect(columns).toContain("tier");
	});

	it("research notes has full-text search vector column", () => {
		const columns = Object.keys(schema.researchNotes);
		expect(columns).toContain("searchVector");
	});

	it("stack snapshots has share token and passcode hash", () => {
		const columns = Object.keys(schema.stackSnapshots);
		expect(columns).toContain("shareToken");
		expect(columns).toContain("sharePasscodeHash");
	});

	it("map connections has source and target node references", () => {
		const columns = Object.keys(schema.mapConnections);
		expect(columns).toContain("sourceNodeId");
		expect(columns).toContain("targetNodeId");
	});
});
