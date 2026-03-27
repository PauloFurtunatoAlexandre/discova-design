"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
	insightCards,
	mapConnections,
	mapNodes,
	projects,
	researchNotes,
	stackItems,
	workspaceMembers,
	workspaces,
} from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import slugify from "slugify";
import { z } from "zod";

function makeSlug(name: string) {
	const base = slugify(name, { lower: true, strict: true, trim: true }) || "workspace";
	return `${base}-${nanoid(4)}`;
}

export async function updateWorkspaceNameAction(
	workspaceId: string,
	name: string,
): Promise<{ error?: string; success?: boolean }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	if (!z.string().uuid().safeParse(workspaceId).success) return { error: "Invalid workspace ID" };

	const parsed = z.string().min(1).max(64).safeParse(name.trim());
	if (!parsed.success) return { error: "Workspace name must be between 1 and 64 characters." };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, session.user.id),
			isNull(workspaceMembers.removedAt),
		),
	});
	if (!membership || membership.tier !== "admin") return { error: "Forbidden" };

	await db
		.update(workspaces)
		.set({ name: parsed.data, slug: makeSlug(parsed.data), updatedAt: new Date() })
		.where(eq(workspaces.id, workspaceId));

	return { success: true };
}

export async function setOnboardingRoleAction(
	workspaceId: string,
	role: string,
): Promise<{ error?: string | undefined; success?: boolean | undefined }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	if (!z.string().uuid().safeParse(workspaceId).success) return { error: "Invalid workspace ID" };

	const validRoles = ["researcher", "pm", "member"] as const;
	const parsed = z.enum(validRoles).safeParse(role);
	if (!parsed.success) return { error: "Invalid role selection." };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, session.user.id),
			isNull(workspaceMembers.removedAt),
		),
	});
	if (!membership) return { error: "Forbidden" };

	await db
		.update(workspaceMembers)
		.set({ workspacePreset: parsed.data })
		.where(eq(workspaceMembers.id, membership.id));

	return { success: true };
}

export async function createOnboardingProjectAction(
	workspaceId: string,
	name: string,
	description: string,
): Promise<{
	error?: string | undefined;
	success?: boolean | undefined;
	projectId?: string | undefined;
}> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	if (!z.string().uuid().safeParse(workspaceId).success) return { error: "Invalid workspace ID" };

	const parsedName = z.string().min(1).max(100).safeParse(name.trim());
	if (!parsedName.success) return { error: "Project name must be between 1 and 100 characters." };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, session.user.id),
			isNull(workspaceMembers.removedAt),
		),
	});
	if (!membership) return { error: "Forbidden" };

	const [project] = await db
		.insert(projects)
		.values({
			workspaceId,
			name: parsedName.data,
			slug: makeSlug(parsedName.data),
			description: description.trim() || null,
			createdBy: session.user.id,
		})
		.returning({ id: projects.id });

	return { success: true, projectId: project?.id };
}

// ── Demo workspace seeding ─────────────────────────────────────────────

export async function seedDemoWorkspaceAction(): Promise<{
	error?: string | undefined;
	workspaceId?: string | undefined;
}> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const userId = session.user.id;

	// Check if user already has a demo workspace
	const existing = await db.query.workspaceMembers.findMany({
		where: and(eq(workspaceMembers.userId, userId), isNull(workspaceMembers.removedAt)),
		with: { workspace: { columns: { id: true, isDemo: true } } },
	});
	const existingDemo = existing.find((m) => m.workspace.isDemo);
	if (existingDemo) {
		return { workspaceId: existingDemo.workspace.id };
	}

	// Create demo workspace
	const [demoWs] = await db
		.insert(workspaces)
		.values({
			name: "Discova Demo",
			slug: `demo-${nanoid(6)}`,
			createdBy: userId,
			isDemo: true,
		})
		.returning({ id: workspaces.id });

	if (!demoWs) return { error: "Failed to create demo workspace" };

	// Add user as admin member
	await db.insert(workspaceMembers).values({
		workspaceId: demoWs.id,
		userId,
		tier: "admin",
		workspacePreset: "researcher",
		invitedBy: userId,
		inviteAcceptedAt: new Date(),
	});

	// Create demo project
	const [demoProject] = await db
		.insert(projects)
		.values({
			workspaceId: demoWs.id,
			name: "Mobile Checkout Redesign",
			slug: `mobile-checkout-redesign-${nanoid(4)}`,
			description:
				"Investigating pain points in the mobile checkout flow to reduce cart abandonment and improve conversion rates.",
			createdBy: userId,
		})
		.returning({ id: projects.id });

	if (!demoProject) return { error: "Failed to create demo project" };

	const projectId = demoProject.id;

	// ── Seed Vault: Research Notes ──
	const now = new Date();

	// sessionDate is a date string (YYYY-MM-DD)
	const dateStr = (n: number) => {
		const d = new Date(now.getTime() - n * 86400000);
		return d.toISOString().split("T")[0] ?? d.toISOString().slice(0, 10);
	};

	const notesData = [
		{
			participantName: "Sarah M., frequent mobile shopper",
			sessionDate: dateStr(14),
			rawContent:
				"Sarah shops on mobile 3-4 times per week. She described the checkout as 'clunky' — too many form fields, no saved addresses, and the payment step feels insecure because there's no visual feedback. She abandoned her cart twice last week because she couldn't find the promo code field. Key quote: 'I just want to tap and go. If it takes more than 30 seconds, I'm out.' She suggested Apple Pay or one-tap checkout. She also mentioned competitor apps that remember her preferences.",
			researchMethod: "interview" as const,
			userSegment: "Power Shopper",
			emotionalTone: "frustrated" as const,
			followUpNeeded: true,
		},
		{
			participantName: "James T., first-time mobile buyer",
			sessionDate: dateStr(12),
			rawContent:
				"James was buying a gift and got confused by the shipping options. He couldn't tell which option would arrive on time, and the estimated delivery dates were missing for two options. He almost abandoned checkout because he wasn't sure if 'Express' meant next-day or 3-day. He also didn't understand why he had to create an account to check out. Key quote: 'I just want to buy this one thing, why do I need a password?' Guest checkout would have kept him in the flow.",
			researchMethod: "usability_test" as const,
			userSegment: "First-Time Buyer",
			emotionalTone: "frustrated" as const,
			followUpNeeded: false,
		},
		{
			participantName: "Survey — 200 mobile users (Dec cohort)",
			sessionDate: dateStr(10),
			rawContent:
				"Survey results from 200 mobile users. Top pain points: (1) Too many form fields — 68% said the form feels too long. (2) No guest checkout — 52% said forced account creation is a dealbreaker. (3) Unclear pricing — 41% said they were surprised by the final total at the payment step (hidden shipping costs, tax added late). Other notable findings: 73% prefer saved payment methods, 61% want Apple Pay/Google Pay, and 45% have abandoned a cart specifically because of the checkout flow in the last month.",
			researchMethod: "survey" as const,
			userSegment: "General Mobile Users",
			emotionalTone: "mixed" as const,
			followUpNeeded: false,
		},
		{
			participantName: "Maria L., screen reader user",
			sessionDate: dateStr(7),
			rawContent:
				"Maria uses VoiceOver on iOS. She reported that form labels are missing on several checkout fields, making it impossible to know what to enter. The promo code field is completely unlabelled. Error messages don't get announced — she had to visually scan for red text she couldn't see. The 'Place Order' button doesn't have a proper accessible name. She rated the experience 2/10. Key quote: 'It feels like accessibility was an afterthought, if it was thought of at all.' She praised the product browsing experience but said checkout is where it falls apart.",
			researchMethod: "usability_test" as const,
			userSegment: "Accessibility User",
			emotionalTone: "frustrated" as const,
			followUpNeeded: true,
		},
		{
			participantName: "David K., returning customer",
			sessionDate: dateStr(5),
			rawContent:
				"David loves the product catalog and search. He's bought 12 items in the last 3 months. His main frustration is that his card details aren't saved between sessions, and he has to re-enter his address every time. He also mentioned that the order confirmation page is confusing — no clear order number, and the confirmation email takes 10+ minutes. Key quote: 'I keep coming back for the products, not the checkout experience.' He'd pay for a premium membership if it meant one-tap checkout.",
			researchMethod: "interview" as const,
			userSegment: "Returning Customer",
			emotionalTone: "mixed" as const,
			followUpNeeded: false,
		},
	];

	const insertedNotes = await db
		.insert(researchNotes)
		.values(notesData.map((n) => ({ ...n, projectId, createdBy: userId })))
		.returning({ id: researchNotes.id });

	// ── Seed Engine: Insight Cards ──
	const insightsData = [
		{
			statement: "Checkout form length is the primary driver of cart abandonment on mobile",
			confidenceScore: 85,
			themeTag: "Friction",
		},
		{
			statement: "Forced account creation blocks 52% of first-time buyers from completing purchase",
			confidenceScore: 78,
			themeTag: "Onboarding",
		},
		{
			statement: "Hidden costs at the payment step erode user trust and increase abandonment",
			confidenceScore: 72,
			themeTag: "Pricing Transparency",
		},
		{
			statement: "Lack of saved payment methods forces repeat data entry for loyal customers",
			confidenceScore: 80,
			themeTag: "Retention",
		},
		{
			statement:
				"Checkout form has critical accessibility gaps preventing screen reader users from completing orders",
			confidenceScore: 90,
			themeTag: "Accessibility",
		},
	];

	const insertedInsights = await db
		.insert(insightCards)
		.values(
			insightsData.map((i) => ({
				...i,
				projectId,
				createdBy: userId,
				acceptedBy: userId,
			})),
		)
		.returning({ id: insightCards.id });

	// ── Seed Map: Nodes + Connections ──
	// Helper to safely access array items
	function at<T>(arr: T[], idx: number): T {
		const item = arr[idx];
		if (item === undefined) throw new Error(`Demo seed: missing item at index ${idx}`);
		return item;
	}

	// Insights (row 1)
	const insightNodes = await db
		.insert(mapNodes)
		.values([
			{
				projectId,
				type: "insight" as const,
				label: "Form too long",
				description: at(insightsData, 0).statement,
				insightId: at(insertedInsights, 0).id,
				positionX: 100,
				positionY: 100,
				createdBy: userId,
			},
			{
				projectId,
				type: "insight" as const,
				label: "Forced account creation",
				description: at(insightsData, 1).statement,
				insightId: at(insertedInsights, 1).id,
				positionX: 400,
				positionY: 100,
				createdBy: userId,
			},
			{
				projectId,
				type: "insight" as const,
				label: "Hidden costs",
				description: at(insightsData, 2).statement,
				insightId: at(insertedInsights, 2).id,
				positionX: 700,
				positionY: 100,
				createdBy: userId,
			},
			{
				projectId,
				type: "insight" as const,
				label: "No saved payments",
				description: at(insightsData, 3).statement,
				insightId: at(insertedInsights, 3).id,
				positionX: 1000,
				positionY: 100,
				createdBy: userId,
			},
			{
				projectId,
				type: "insight" as const,
				label: "Accessibility gaps",
				description: at(insightsData, 4).statement,
				insightId: at(insertedInsights, 4).id,
				positionX: 1300,
				positionY: 100,
				createdBy: userId,
			},
		])
		.returning({ id: mapNodes.id });

	// Problems (row 2)
	const problemNodes = await db
		.insert(mapNodes)
		.values([
			{
				projectId,
				type: "problem" as const,
				label: "Cart abandonment from form friction",
				description:
					"Users leave checkout because the form requires too many fields on a small screen",
				positionX: 250,
				positionY: 300,
				createdBy: userId,
			},
			{
				projectId,
				type: "problem" as const,
				label: "First-time buyer drop-off",
				description: "New users are blocked by mandatory account creation and unclear pricing",
				positionX: 550,
				positionY: 300,
				createdBy: userId,
			},
			{
				projectId,
				type: "problem" as const,
				label: "Repeat purchase friction",
				description:
					"Returning customers must re-enter payment and address information every session",
				positionX: 1000,
				positionY: 300,
				createdBy: userId,
			},
		])
		.returning({ id: mapNodes.id });

	// Solutions (row 3)
	const solutionNodes = await db
		.insert(mapNodes)
		.values([
			{
				projectId,
				type: "solution" as const,
				label: "Smart one-page checkout",
				description: "Collapse checkout to a single scrollable page with progressive disclosure",
				positionX: 250,
				positionY: 500,
				createdBy: userId,
			},
			{
				projectId,
				type: "solution" as const,
				label: "Guest checkout + express pay",
				description: "Add guest checkout option and integrate Apple Pay / Google Pay",
				positionX: 550,
				positionY: 500,
				createdBy: userId,
			},
			{
				projectId,
				type: "solution" as const,
				label: "Transparent pricing summary",
				description: "Show running total with tax and shipping estimates from the cart page",
				positionX: 850,
				positionY: 500,
				createdBy: userId,
			},
			{
				projectId,
				type: "solution" as const,
				label: "Saved payment profiles",
				description: "Allow users to securely save and manage payment methods and addresses",
				positionX: 1100,
				positionY: 500,
				createdBy: userId,
			},
		])
		.returning({ id: mapNodes.id });

	// Helper to safely get node ID by index
	function nodeId(arr: { id: string }[], idx: number): string {
		const node = arr[idx];
		if (!node) throw new Error(`Demo seed: missing node at index ${idx}`);
		return node.id;
	}

	// Connections: insight → problem → solution
	const connections = [
		{ sourceNodeId: nodeId(insightNodes, 0), targetNodeId: nodeId(problemNodes, 0) },
		{ sourceNodeId: nodeId(insightNodes, 1), targetNodeId: nodeId(problemNodes, 1) },
		{ sourceNodeId: nodeId(insightNodes, 2), targetNodeId: nodeId(problemNodes, 1) },
		{ sourceNodeId: nodeId(insightNodes, 3), targetNodeId: nodeId(problemNodes, 2) },
		{ sourceNodeId: nodeId(insightNodes, 4), targetNodeId: nodeId(problemNodes, 0) },
		{ sourceNodeId: nodeId(problemNodes, 0), targetNodeId: nodeId(solutionNodes, 0) },
		{ sourceNodeId: nodeId(problemNodes, 1), targetNodeId: nodeId(solutionNodes, 1) },
		{ sourceNodeId: nodeId(problemNodes, 1), targetNodeId: nodeId(solutionNodes, 2) },
		{ sourceNodeId: nodeId(problemNodes, 2), targetNodeId: nodeId(solutionNodes, 3) },
	];

	await db
		.insert(mapConnections)
		.values(connections.map((c) => ({ ...c, projectId, createdBy: userId })));

	// ── Seed Stack: RICE scores ──
	await db.insert(stackItems).values([
		{
			projectId,
			solutionNodeId: nodeId(solutionNodes, 0),
			reachAuto: 85,
			impactAuto: 3,
			confidenceAuto: 80,
			effortManual: 5,
			riceScore: 40.8,
			tier: "now" as const,
			lastEditedBy: userId,
		},
		{
			projectId,
			solutionNodeId: nodeId(solutionNodes, 1),
			reachAuto: 72,
			impactAuto: 3,
			confidenceAuto: 75,
			effortManual: 3,
			riceScore: 54,
			tier: "now" as const,
			lastEditedBy: userId,
		},
		{
			projectId,
			solutionNodeId: nodeId(solutionNodes, 2),
			reachAuto: 60,
			impactAuto: 2,
			confidenceAuto: 70,
			effortManual: 2,
			riceScore: 42,
			tier: "next" as const,
			lastEditedBy: userId,
		},
		{
			projectId,
			solutionNodeId: nodeId(solutionNodes, 3),
			reachAuto: 45,
			impactAuto: 2,
			confidenceAuto: 65,
			effortManual: 4,
			riceScore: 14.6,
			tier: "later" as const,
			lastEditedBy: userId,
		},
	]);

	return { workspaceId: demoWs.id };
}
