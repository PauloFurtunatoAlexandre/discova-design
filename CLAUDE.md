# DISCOVA — Claude Code Development Guide

> **Put this file at `CLAUDE.md` in your project root.**
> Claude Code reads this automatically on every session.

---

## PROJECT OVERVIEW

Discova is a product discovery platform: Workspace → Project → Phase (Vault, Engine, Map, Stack, Team). You are building the MVP following a 36-prompt sequential implementation plan.

## STACK (LOCKED — do not deviate)

- Next.js 15 App Router, React 19, TypeScript strict
- Tailwind CSS 4 (CSS-based config with @theme, NOT tailwind.config.ts)
- shadcn/ui (New York variant), Framer Motion, Lucide icons
- Tiptap (rich text editor in Vault)
- PostgreSQL + Drizzle ORM (database sessions, NOT JWT)
- Auth.js v5 (NextAuth) with database sessions
- Zod validation at every boundary
- React Query (@tanstack/react-query) for client data
- Pino (structured logging), Sentry (error monitoring), Resend (email)
- Vitest (unit/integration), Playwright (E2E)
- Biome (lint + format), pnpm

## ARCHITECTURE RULES

### Server vs Client Components
- Pages are Server Components (fetch data, check permissions)
- Interactive UI is Client Components ("use client")
- Push "use client" to leaf components — never at layout level
- Pass server data as props to client components

### Server Actions
- Every mutation goes through a Server Action (in src/actions/)
- Every Server Action is wrapped in `withPermission` guard (src/lib/permissions/guard.ts)
- Every Server Action validates input with Zod
- Every write operation creates an audit log entry
- Return `{ success, error, fieldErrors }` — never throw to client

### Permissions
- Two systems: Tier (Admin/Member/Viewer) + Preset (Researcher/PM/Member)
- Preset resolution: project_preset → workspace_preset → global_preset → NO_ACCESS
- Null preset = blocked UI, not silent read-only
- Admin bypasses all preset checks
- Viewer = read-only everything
- Client-side permission checks (usePermissions hook) are for UI only — server always re-verifies

### Database
- Drizzle ORM — never raw SQL strings
- UUID primary keys (defaultRandom)
- All timestamps use `timestamptz`
- Enums as check constraints, NOT PostgreSQL ENUM type
- Relations with `relationName` when a table has multiple FKs to the same target table
- Soft delete where specified (removedAt, archivedAt)

### Design System
- ALL colors via CSS variables from src/styles/tokens.css
- ZERO hardcoded hex values in components
- Dark theme is primary, light is full-quality alternative
- Fonts: Lora (display), DM Sans (body), JetBrains Mono (labels/code)
- Phase colors: Vault=gold, Engine=blue, Map=coral, Stack=green, Team=purple

### Motion
- Framer Motion spring physics — no linear easing
- Entrance/exit asymmetry: exits are 80% of entrance duration
- One thing moves at a time
- prefers-reduced-motion: replace transforms with opacity-only, keep color changes

### Focus & Accessibility
- 2px solid outline with 2px offset on all interactive elements
- Focus color: var(--color-border-focus)
- Non-negotiable on dark backgrounds

## KEY REFERENCE FILES

- `docs/discova-phase1-implementation-prompts-v2.md` — Master plan with all 36 prompt specs
- `docs/discova-prd.docx` — Full PRD
- `docs/discova-prebuild-blockers.docx` — Permission model + Map node visual states
- `docs/discova-design-system-theming-prompt.md` — Complete token values
- `src/styles/tokens.css` — Design tokens (dark + light)
- `src/styles/map-nodes.css` — Map node state tokens
- `src/lib/permissions/` — Permission engine (types, resolution, guard)
- `src/lib/constants/phases.ts` — Phase configuration

## HOW TO IMPLEMENT A NEW PROMPT

When I say "implement Prompt N", follow this process:

1. **Read the spec** in `docs/discova-phase1-implementation-prompts-v2.md` for that prompt number
2. **Read existing code** — check what files already exist in the relevant directories
3. **Implement in chunks** — break the prompt into 2-4 smaller tasks:
   - Chunk A: Data layer (schema changes, queries, Server Actions)
   - Chunk B: Core UI component(s)
   - Chunk C: Wiring (page, routing, integration with existing components)
   - Chunk D: Tests
4. **After each chunk**: verify with `pnpm typecheck` — fix before moving on
5. **Never rewrite files that are working** — only add to or modify specific sections

## COMMON PATTERNS

### Server Action pattern
```typescript
export const myAction = withPermission(
  { phase: "vault", action: "write" },
  async (ctx, args: { workspaceId: string; projectId: string; /* ... */ }) => {
    // 1. Validate with Zod
    // 2. Verify ownership (anti-IDOR)
    // 3. Database operation
    // 4. Audit log
    // 5. revalidatePath
    // 6. Return { success: true, data }
  }
);
```

### Page pattern
```typescript
// Server Component
export default async function MyPage({ params }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { workspaceId, projectId } = await params;
  
  const permission = await checkPermission({ ... });
  if (!permission.allowed) redirect(`/${workspaceId}`);
  
  const data = await fetchData(projectId);
  return <ClientComponent data={data} canEdit={writePermission.allowed} />;
}
```

### Component visual spec pattern
```
Background: var(--color-bg-surface)
Border: 1px solid var(--color-border-subtle)
Border-radius: var(--radius-lg)
Text: font-family var(--font-body), color var(--color-text-primary)
Labels: font-family var(--font-mono), var(--text-xs), var(--color-text-muted), uppercase, tracking-wide
```

## CURRENT STATUS

Prompts 01–19 implemented. Layers 0–3 (Foundation, Shell, Vault, Engine) built.
Next: Layer 4 (Map) — Prompts 20–23.

## CHUNKING STRATEGY FOR REMAINING PROMPTS

When I ask you to implement a prompt, break it down as follows:

### Prompt 20 (Map Canvas) — 3 chunks:
- A: Data layer (types, constants, layout engine, queries)
- B: Canvas + node component (pan/zoom, 5 visual states)
- C: Connection lines + toolbar + page wiring

### Prompt 21 (Node Creation + Connections) — 3 chunks:
- A: Server Actions (create node, create connection, delete)
- B: UI (slide-over forms, unplaced insights sidebar)
- C: Drag-to-connect interaction + connection validation

### Prompt 22 (Canvas Interactions) — 4 chunks:
- A: Node dragging + position persistence
- B: Search overlay (⌘K)
- C: Collapse/expand groups
- D: Mini-map

### Prompt 23 (Map QA) — 1 chunk (E2E tests + audit)

### Prompt 24 (RICE Scoring + Stack Table) — 3 chunks:
- A: RICE calculation engine (pure function + Server Actions)
- B: Stack table view with editable cells
- C: Tier assignment + sorting

### Prompt 25 (Lock + Snapshot) — 2 chunks:
- A: Lock mechanism + snapshot creation
- B: Locked view styling + unlock flow

### Prompt 26 (Stakeholder Share) — 3 chunks:
- A: Passcode gate + share token generation
- B: Stakeholder view (working + presentation modes)
- C: PDF export

### Prompt 27 (Stack QA) — 1 chunk

### Prompt 28 (Invites + Members) — 3 chunks:
- A: Invite Server Actions + email
- B: Invite modal + member table
- C: Anonymization on removal

### Prompt 29 (Comments + Presence) — 2 chunks:
- A: Comments system (CRUD + threading)
- B: Presence indicators (polling)

### Prompt 30 (Email Notifications) — 2 chunks:
- A: Email templates (React Email)
- B: Notification triggers + delivery

### Prompts 31–34 (Integrations) — 1 chunk each:
- 31: Jira
- 32: Linear
- 33: Slack
- 34: Figma

### Prompt 35 (Onboarding + Demo) — 2 chunks:
- A: 4-step onboarding wizard
- B: Demo workspace seeding + empty states

### Prompt 36 (Final QA) — 1 chunk