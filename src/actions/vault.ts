"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { db } from "@/lib/db"
import { researchNotes, quoteObjects } from "@/lib/db/schema"
import { resolvePreset, can } from "@/lib/auth/permissions"
import { eq, and, isNull } from "drizzle-orm"

// ── Validation schemas ────────────────────────────────────────────────

const CreateNoteSchema = z.object({
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  participantSource: z.string().min(1).max(500),
  sessionDate: z.coerce.date(),
  rawNotes: z.string().min(1),
  // Optional metadata
  title: z.string().max(300).optional(),
  researchMethod: z
    .enum(["interview", "survey", "usability_test", "observation", "other"])
    .optional(),
  userSegment: z.string().max(200).optional(),
  emotionalTone: z.enum(["frustrated", "delighted", "neutral", "mixed"]).optional(),
  assumptionsTested: z.string().max(1000).optional(),
  followUpNeeded: z.boolean().default(false),
  sessionRecordingUrl: z.string().url().optional(),
  customTags: z.array(z.string().max(50)).max(20).default([]),
})

const CreateQuoteSchema = z.object({
  noteId: z.string().uuid(),
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid(),
  text: z.string().min(1).max(5000),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  annotation: z.string().max(500).optional(),
})

// ── Server Actions ────────────────────────────────────────────────────

export async function createNote(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const parsed = CreateNoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { projectId, workspaceId, ...noteData } = parsed.data

  const preset = await resolvePreset(session.user.id, projectId, workspaceId)
  if (!can(preset, "vault", "write")) return { error: "Forbidden" }

  const [note] = await db
    .insert(researchNotes)
    .values({
      projectId,
      createdBy: session.user.id,
      ...noteData,
    })
    .returning()

  revalidatePath(`/vault`)
  return { data: note }
}

export async function updateNote(
  noteId: string,
  workspaceId: string,
  input: unknown
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // Verify ownership — fetch note to get projectId
  const note = await db.query.researchNotes.findFirst({
    where: and(eq(researchNotes.id, noteId), isNull(researchNotes.deletedAt)),
    columns: { projectId: true, createdBy: true },
  })

  if (!note) return { error: "Not found" }

  const preset = await resolvePreset(session.user.id, note.projectId, workspaceId)
  if (!can(preset, "vault", "write")) return { error: "Forbidden" }

  const UpdateNoteSchema = CreateNoteSchema.omit({
    projectId: true,
    workspaceId: true,
  }).partial()
  const parsed = UpdateNoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const [updated] = await db
    .update(researchNotes)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(researchNotes.id, noteId))
    .returning()

  revalidatePath(`/vault/${noteId}`)
  revalidatePath(`/vault`)
  return { data: updated }
}

export async function deleteNote(noteId: string, workspaceId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const note = await db.query.researchNotes.findFirst({
    where: and(eq(researchNotes.id, noteId), isNull(researchNotes.deletedAt)),
    columns: { projectId: true, createdBy: true },
  })

  if (!note) return { error: "Not found" }

  const preset = await resolvePreset(session.user.id, note.projectId, workspaceId)
  if (!can(preset, "vault", "write")) return { error: "Forbidden" }

  // Soft delete — preserve data for evidence chain integrity
  await db
    .update(researchNotes)
    .set({ deletedAt: new Date() })
    .where(eq(researchNotes.id, noteId))

  revalidatePath(`/vault`)
  return { data: { deleted: true } }
}

export async function extractQuote(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const parsed = CreateQuoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { workspaceId, ...quoteData } = parsed.data

  const preset = await resolvePreset(
    session.user.id,
    quoteData.projectId,
    workspaceId
  )
  if (!can(preset, "vault", "write")) return { error: "Forbidden" }

  const [quote] = await db
    .insert(quoteObjects)
    .values({ ...quoteData, createdBy: session.user.id })
    .returning()

  revalidatePath(`/vault/${quoteData.noteId}`)
  return { data: quote }
}
