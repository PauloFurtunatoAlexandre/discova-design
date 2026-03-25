import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { mapNodes, quotes, researchNotes } from "@/lib/db/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/engine/prompts";
import {
	acquireWorkspaceConcurrency,
	checkAnalysisRateLimit,
	releaseWorkspaceConcurrency,
} from "@/lib/engine/rate-limit";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
	noteId: z.string().uuid(),
	workspaceId: z.string().uuid(),
	projectId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await request.json();
		const parsed = requestSchema.safeParse(body);
		if (!parsed.success) {
			return new Response(JSON.stringify({ error: "Invalid request" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const { noteId, workspaceId, projectId } = parsed.data;

		// Permission check: Engine write access
		const permission = await checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "engine",
			action: "write",
		});

		if (!permission.allowed) {
			return new Response(JSON.stringify({ error: permission.reason }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Rate limit
		const rateCheck = checkAnalysisRateLimit(session.user.id);
		if (!rateCheck.allowed) {
			return new Response(
				JSON.stringify({
					error: "rate_limited",
					retryAfterSeconds: rateCheck.retryAfterSeconds,
					message: `You've reached the analysis limit. Try again in ${Math.ceil((rateCheck.retryAfterSeconds ?? 60) / 60)} minutes.`,
				}),
				{ status: 429, headers: { "Content-Type": "application/json" } },
			);
		}

		// Workspace concurrency
		if (!acquireWorkspaceConcurrency(workspaceId)) {
			return new Response(
				JSON.stringify({
					error: "concurrent_limit",
					message: "Too many analyses running in this workspace. Please wait for one to finish.",
				}),
				{ status: 429, headers: { "Content-Type": "application/json" } },
			);
		}

		try {
			// Fetch note — note must belong to the specified project (IDOR protection)
			const [note] = await db
				.select()
				.from(researchNotes)
				.where(and(eq(researchNotes.id, noteId), eq(researchNotes.projectId, projectId)))
				.limit(1);

			if (!note) {
				return new Response(JSON.stringify({ error: "Note not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Fetch existing quotes for this note
			const existingQuotes = await db
				.select({
					text: quotes.text,
					startOffset: quotes.startOffset,
					endOffset: quotes.endOffset,
				})
				.from(quotes)
				.where(eq(quotes.noteId, noteId));

			// Fetch existing problem nodes from the project's Map
			const existingProblems = await db
				.select({ label: mapNodes.label })
				.from(mapNodes)
				.where(and(eq(mapNodes.projectId, projectId), eq(mapNodes.type, "problem")));

			// Extract plain text from rawContent (may be Tiptap JSON)
			const noteContent = extractPlainText(note.rawContent);

			// Build prompts
			const systemPrompt = buildSystemPrompt();
			const userPrompt = buildUserPrompt({
				noteContent,
				participantName: note.participantName,
				sessionDate: String(note.sessionDate),
				researchMethod: note.researchMethod ?? null,
				existingQuotes,
				existingProblems,
			});

			// Audit log (fire-and-forget — do not block the stream)
			createAuditEntry({
				workspaceId,
				userId: session.user.id,
				action: "engine.analysis_started",
				targetType: "research_note",
				targetId: noteId,
				metadata: {
					contentLength: noteContent.length,
					quoteCount: existingQuotes.length,
				},
			}).catch((err) => logger.error({ err }, "Failed to create audit log entry"));

			// Stream from Anthropic via Vercel AI SDK
			const result = streamText({
				model: anthropic("claude-sonnet-4-20250514"),
				system: systemPrompt,
				prompt: userPrompt,
				maxOutputTokens: 4000,
				temperature: 0.3, // Low temperature for structured output
			});

			return result.toTextStreamResponse();
		} finally {
			releaseWorkspaceConcurrency(workspaceId);
		}
	} catch (err) {
		logger.error({ err }, "Analysis API route error");
		return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

// ── Plain-text extraction ─────────────────────────────────────────────────────

function extractPlainText(rawContent: string): string {
	try {
		const doc = JSON.parse(rawContent) as Record<string, unknown>;
		return extractTextFromTiptapDoc(doc);
	} catch {
		return rawContent;
	}
}

function extractTextFromTiptapDoc(node: Record<string, unknown>): string {
	if (node.type === "text" && typeof node.text === "string") {
		return node.text;
	}
	const content = node.content as Array<Record<string, unknown>> | undefined;
	if (!content || !Array.isArray(content)) return "";

	const separator =
		node.type === "paragraph" || node.type === "heading" || node.type === "doc" ? "\n" : "";
	return content.map((child) => extractTextFromTiptapDoc(child)).join(separator);
}
