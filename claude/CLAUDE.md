# Discova — Claude Code Context

## What This Product Is

Discova is a product discovery platform that creates a verifiable chain from
user research to shipped features. It replaces the 4–6 disconnected tools
product teams use for research, synthesis, mapping, and prioritisation.

**Core value proposition:** "The missing layer between what your users say
and what your team decides to build."

---

## The Five Phases (Core Product Model)

Every feature you touch belongs to one of these phases. Always know which
phase you're in before writing code.

| # | Name   | Action     | Accent Colour | What it does |
|---|--------|------------|---------------|--------------|
| 1 | Vault  | Store      | Gold #E8C547  | Capture raw research notes + quotes |
| 2 | Engine | Synthesise | Blue #5B8AF0  | AI-assisted insight card creation |
| 3 | Map    | Connect    | Coral #E87D5B | Visual insight→problem→solution graph |
| 4 | Stack  | Decide     | Green #7EBF8E | RICE-scored priority ranking |
| 5 | Team   | Align      | Purple #C47DB8 | Roles, sharing, stakeholder output |

**User flow:** Hybrid — entry points differ by role, everyone converges on
the Stack. The aha moments are Engine (researchers) and Stack (PMs).

---

## Tech Stack

```
Framework:     Next.js 15 (App Router, Server Components by default)
Language:      TypeScript — strict mode, no `any`, ever
Styling:       Tailwind CSS 4 with @theme tokens
Components:    shadcn/ui primitives (Nova style)
Animation:     Framer Motion
ORM:           Drizzle ORM
Database:      PostgreSQL (Supabase for early stage)
Auth:          Auth.js (NextAuth v5) — database sessions, NOT JWT
Cache/Queue:   Redis (Upstash) + BullMQ
AI:            Anthropic SDK (claude-sonnet-4-20250514)
Validation:    Zod at every API boundary
Package mgr:   pnpm
Linting:       Biome (replaces ESLint + Prettier)
Deployment:    Vercel
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Public auth routes — no sidebar
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/  # 4-step wizard (workspace → project → invite)
│   ├── (app)/                              # Protected app routes — with sidebar
│   │   ├── dashboard/                      # Home — activity, phase progress, quick actions
│   │   ├── [workspaceId]/
│   │   │   ├── [projectId]/
│   │   │   │   ├── vault/                  # Phase 01 — research notes
│   │   │   │   ├── engine/                 # Phase 02 — insight cards
│   │   │   │   ├── map/                    # Phase 03 — opportunity map canvas
│   │   │   │   ├── stack/                  # Phase 04 — priority stack
│   │   │   │   └── team/                   # Phase 05 — team management
│   │   │   └── settings/                   # Workspace + user settings
│   ├── api/
│   │   ├── auth/        # Auth.js endpoints
│   │   └── webhooks/    # Jira, Linear, Slack inbound webhooks
│   └── share/           # Public stakeholder share view (no auth required)
│
├── actions/             # Server Actions — one file per domain
│   ├── vault.ts
│   ├── engine.ts
│   ├── map.ts
│   ├── stack.ts
│   └── team.ts
│
├── components/
│   ├── ui/              # shadcn/ui re-exports (do not edit directly)
│   ├── layouts/         # AppLayout, AuthLayout, ShareLayout
│   ├── shared/          # Cross-phase: Sidebar, Header, CommandPalette, etc.
│   ├── vault/           # NoteCard, NoteWizard, QuoteExtractor, etc.
│   ├── engine/          # InsightCard, AISuggestionCard, ConfidenceRing, etc.
│   ├── map/             # MapCanvas, InsightNode, ProblemNode, SolutionNode, etc.
│   ├── stack/           # PriorityRow, RiceScore, StackHeader, LockBanner, etc.
│   └── team/            # MemberList, InviteModal, ShareModal, etc.
│
├── lib/
│   ├── db/
│   │   ├── index.ts     # Drizzle client singleton
│   │   ├── schema/      # One file per table group
│   │   ├── migrations/  # Drizzle migration files (auto-generated)
│   │   └── queries/     # Reusable typed query functions
│   ├── auth/
│   │   ├── config.ts    # Auth.js configuration
│   │   └── permissions.ts # resolvePreset() + can() helper
│   ├── ai/
│   │   ├── client.ts    # Anthropic SDK singleton
│   │   └── prompts/     # Prompt templates per AI feature
│   ├── integrations/
│   │   ├── jira/
│   │   ├── linear/
│   │   ├── slack/
│   │   └── figma/
│   ├── validations/     # Zod schemas — one file per domain
│   └── utils/           # Pure utility functions
│
├── hooks/               # Custom React hooks (client-side only)
├── types/               # Shared TypeScript types + Drizzle inferred types
└── styles/
    ├── globals.css      # Tailwind base + @theme tokens
    └── map-nodes.css    # Map node visual state tokens (see BLOCKERS.md)
```

---

## Permissions System

**Two separate concepts — never conflate them:**

### Permission Tier (what you can DO)
Stored on `workspace_members.tier`:
- `admin` — full access including billing, invites, workspace deletion
- `member` — create/edit own content, cannot manage workspace
- `viewer` — read-only everywhere, no comments

### Functional Preset (which phases you can EDIT)
Stored on `users.global_preset`, overridden by `workspace_members.workspace_preset`,
further overridden by `project_members.project_preset`.

Preset resolution order (project > workspace > global):
```typescript
// Always use this function — never resolve preset inline
import { resolvePreset } from "@/lib/auth/permissions"
const preset = await resolvePreset(userId, projectId, workspaceId)
// returns: "researcher" | "pm" | "member" | "no_access"
```

**Phase access by preset:**
| Preset     | Vault | Engine | Map | Stack | Team |
|------------|-------|--------|-----|-------|------|
| researcher | R/W   | R/W    | R/W | Read  | Read |
| pm         | Read  | Read   | R/W | R/W   | R/W  |
| member     | R/W   | R/W    | R/W | R/W   | R/W  |
| no_access  | —     | —      | —   | —     | —    |

**Null preset = NO_ACCESS. Never silently default to member.**

---

## Database Schema (Drizzle)

Key tables and their relationships:

```
users
  └── workspace_members (tier + workspace_preset)
        └── workspaces
              └── projects
                    └── project_members (project_preset overrides)
                    └── research_notes → quote_objects
                    └── insight_cards → insight_evidence_links
                    └── map_problems → map_solutions
                    └── stack_items (RICE scores, lock snapshots)
```

Full schema in `src/lib/db/schema/`. Import types via:
```typescript
import type { User, Workspace, ResearchNote } from "@/types/db"
```

---

## Map Node Visual States

The Map canvas has 5 node states. These are defined as CSS tokens in
`src/styles/map-nodes.css`. Never hardcode node colours inline.

```
connected      → solid border, full phase-colour opacity
unconnected    → dashed border, 40% phase-colour opacity, 70% node opacity
orphan-warning → dashed amber border (Solution nodes only)
selected       → 2px solid border, glow ring, connection handles visible
hover          → scale(1.02), 120ms ease-out, border brightened
```

See `docs/map-node-tokens.md` for full token reference.

---

## AI Integration

- Model: `claude-sonnet-4-20250514` (always use this — never hardcode a different model)
- AI is an **accelerator**, not the core differentiator. Structure is the moat.
- All AI calls go through `src/lib/ai/client.ts` — never instantiate Anthropic SDK directly in components
- Heavy AI jobs (batch synthesis, export generation) go in BullMQ workers, not Server Actions
- Rate limit AI endpoints with Upstash ratelimit

```typescript
// Always use the singleton
import { anthropic } from "@/lib/ai/client"
```

---

## Server Actions Rules

Every Server Action must follow this pattern:

```typescript
"use server"
import { z } from "zod"
import { auth } from "@/lib/auth/config"
import { resolvePreset, can } from "@/lib/auth/permissions"

export async function createNote(input: unknown) {
  // 1. Auth check first
  const session = await auth()
  if (!session?.user) return { error: "Unauthorized" }

  // 2. Input validation
  const parsed = CreateNoteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.flatten() }

  // 3. Permission check
  const preset = await resolvePreset(session.user.id, parsed.data.projectId, workspaceId)
  if (!can(preset, "vault", "write")) return { error: "Forbidden" }

  // 4. Business logic + DB
  // ...

  // 5. Revalidate
  revalidatePath(`/vault`)
  return { data: result }
}
```

---

## Key Design Decisions (Reference the PRD for full context)

- **Route structure** — `(app)/[workspaceId]/[projectId]/vault/` (dynamic segments). Workspace and project are always in the URL — every view is bookmarkable and shareable. Context is never resolved from session alone.
- **Notes are scoped to one project** — no cross-project research in MVP
- **Orphan solutions** are soft-warned, not hard-blocked
- **Stack scores are live** — lock is triggered by Share action, not manually
- **Stakeholder share links** are passcode-protected, no login required
- **Demo workspace** ships pre-loaded; real workspace lives alongside it
- **Titles are not required** on research notes — fallback to first 80 chars of raw notes

---

## Environment Variables

See `.env.example` for the full list. Required to run locally:
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Biome lint + format check
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # tsc --noEmit
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Open Drizzle Studio
pnpm test             # Run Vitest
```

---

## What NOT to Do

- Never add `"use client"` to layout or page files — push it to leaf components
- Never use `SELECT *` — always specify columns in Drizzle queries
- Never put secrets in `NEXT_PUBLIC_*` env vars
- Never resolve permissions inline — always use `resolvePreset()` + `can()`
- Never call Anthropic SDK directly in components — use `src/lib/ai/client.ts`
- Never use `console.log` — use `pino` logger
- Never default null preset to member access — null = NO_ACCESS

---

## Docs

- `docs/prd.md` — Full product requirements document
- `docs/permissions-schema.md` — Complete permissions data model
- `docs/map-node-tokens.md` — Map node visual state token reference
- `docs/integrations.md` — Jira, Linear, Slack, Figma integration specs
