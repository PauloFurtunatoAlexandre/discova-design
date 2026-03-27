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

All 36 prompts implemented. MVP feature-complete.
Hardening phase in progress — Sprints 1-2 complete. Next: Sprint 3.

---

## IMPROVEMENT PLAN

### Lessons Learned (bugs we shipped and must prevent)

These are real bugs found during development. Every future implementation must check for these patterns:

1. **Date serialization across server/client boundary** — Date objects become JSON strings when passed as props from Server Components to Client Components. ALWAYS wrap with `new Date(value)` before calling `.getTime()`, `.toLocaleDateString()`, etc. Accept `Date | string` in helper functions.
2. **React passive event listeners** — React registers `onWheel` and `onTouchMove` as passive by default. `e.preventDefault()` silently fails. Use `useEffect` + native `addEventListener("wheel", fn, { passive: false })` instead.
3. **HTML `<dialog>` default styles** — `<dialog>` has `margin: auto`, `inset: 0`, `max-width/max-height` defaults that override CSS classes. Always add explicit inline style resets: `margin: 0, padding: 0, maxWidth: "none", maxHeight: "none", inset: "auto"`.
4. **Canvas height in scrollable layouts** — `<main>` with `overflow-y-auto` lets canvas content scroll instead of filling the viewport. Wrap canvas components in an explicit height container: `h-[calc(100vh-var(--topbar-height))]`.
5. **Array access with `noUncheckedIndexedAccess`** — `arr[0]` returns `T | undefined`. Use a safe accessor like `at()` that throws, or check before use.

---

### Phase 1: Security Hardening

#### S1. Consistent auth guard on all Server Actions
**Priority: CRITICAL**
**Files:** `src/actions/comments.ts`, `src/actions/engine.ts`, `src/actions/integrations.ts`, `src/actions/notifications.ts`, `src/actions/team.ts`, `src/actions/presence.ts`, `src/actions/confidence.ts`, `src/actions/projects.ts`, `src/actions/workspaces.ts`, `src/actions/onboarding.ts`, `src/actions/auth.ts`
- 11 of 16 action files use manual `auth()` instead of `withPermission` guard
- Migrate all phase-scoped actions to `withPermission`
- For workspace-level actions (projects, team, workspaces), create a `withWorkspaceAuth` wrapper that verifies membership + tier
- For auth-level actions (signup, login), keep manual auth but add explicit Zod validation on all inputs
- Specific gaps found:
  - `src/actions/presence.ts` — `heartbeatAction` has NO workspace/project permission check (IDOR: reveals active users for any project)
  - `src/actions/notifications.ts` — no workspace context validation on fetch/modify
  - `src/actions/integrations.ts` — `getIntegrationsAction` doesn't verify user is workspace admin
  - `src/actions/comments.ts` — uses custom `verifyMembership()` instead of centralized `checkPermission()`

#### S2. Fix integration token encryption (FAKE encryption)
**Priority: CRITICAL**
**File:** `src/lib/integrations/shared.ts` (lines 128-140)
- `encryptToken()` uses Base64 encoding, NOT real encryption — tokens are essentially plaintext
- Fallback key is hardcoded: `"dev-key-replace-in-production"` — if env var is missing, all tokens share one public key
- **Fix:** Replace with AES-256-GCM using Node.js `crypto` module (32-byte key, random IV per token)
- **Fix:** Fail loudly in production if `INTEGRATION_ENCRYPTION_KEY` is not set or < 32 chars
- **Fix:** Move sensitive fields like `webhookUrl` out of plain `config` JSON column into encrypted storage

#### S3. Fix OAuth state parameter (CSRF vulnerability)
**Priority: CRITICAL**
**Files:** All 4 integration callback routes (`src/app/api/integrations/{jira,linear,slack,figma}/callback/route.ts`)
- OAuth `state` parameter is used directly as `workspaceId` with zero validation
- Attacker can craft OAuth flow with `state=victim-workspace-id` — if victim completes, integration connects to wrong workspace
- **Fix:** Generate cryptographically random state nonce server-side, store in short-lived session/cookie
- **Fix:** On callback, validate state matches stored nonce AND verify user is a member of the target workspace

#### S4. Missing authorization on Map Problems API
**Priority: CRITICAL**
**File:** `src/app/api/map/problems/route.ts` (lines 8-50)
- GET route lists all problems for a project with NO permission check
- Only validates that `projectId` query param exists
- **Fix:** Add `checkPermission()` before querying, same as vault/quotes route pattern

#### S5. Rate limiting on all public-facing endpoints
**Priority: HIGH**
**Files:** All `src/app/api/**/route.ts` (18 routes)
- Only auth and engine/analyse have rate limiting currently
- Add rate limiting to: all integration OAuth callbacks, vault API routes, permissions route, map problems route
- Use existing `src/lib/auth/rate-limit.ts` pattern — extend to a shared utility
- Consider IP + userId composite keys for authenticated routes
- Note: current rate limiter is in-memory only (`Map<string, RateLimitEntry>`) — replace with Upstash before multi-instance deployment

#### S6. Security headers in `next.config.ts`
**Priority: HIGH**
**File:** `next.config.ts`
- Currently empty config (only Sentry wrapper)
- Add headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (disable camera, mic, geolocation)
- Add basic CSP: `default-src 'self'`, allow inline styles (needed for Framer Motion), allow Supabase/Sentry domains
- Add `Strict-Transport-Security` for production

#### S7. Input validation audit
**Priority: HIGH**
**Files:** All actions and API routes
- Verify every user-facing input is Zod-validated before database operations
- Add `.max()` length constraints on all string inputs (title, description, content fields)
- Add `.uuid()` validation on all ID parameters to prevent injection
- Sanitize rich text content from Tiptap before storage

#### S8. IDOR protection audit
**Priority: HIGH**
- Every mutation that accepts `workspaceId` + `projectId` must verify the authenticated user is a member of that workspace AND the project belongs to that workspace
- Create a reusable `verifyProjectOwnership(userId, workspaceId, projectId)` helper
- Audit all existing actions for this pattern

#### S9. Cookie and session security
**Priority: MEDIUM**
**File:** `src/lib/auth/config.ts`
- **`allowDangerousEmailAccountLinking: true`** on Google provider — enables account takeover: attacker signs up via Google OAuth with victim's email and links to their existing account. Set to `false` and implement proper email verification flow
- JWT strategy is used (required for credentials provider) — ensure `httpOnly`, `secure`, `sameSite: "lax"` are set
- Add CSRF token rotation on session refresh

---

### Phase 2: Performance Optimization

#### P1. Database indexes
**Priority: CRITICAL**
**Files:** All `src/lib/db/schema/*.ts` (24 schema files)
- ZERO indexes defined in the entire schema — every query does a full table scan
- Add indexes for:
  - `workspace_members(userId)` — used on every auth check
  - `workspace_members(workspaceId, userId)` — composite for membership lookups
  - `project_members(projectId, userId)` — permission checks
  - `projects(workspaceId)` — project listing
  - `research_notes(projectId)` — vault page
  - `insight_cards(projectId)` — engine page
  - `map_nodes(projectId)` — map page
  - `map_connections(projectId, sourceNodeId)`, `(projectId, targetNodeId)` — composites for map queries
  - `stack_items(projectId)` — stack page
  - `comments(targetType, targetId)` — comment threads
  - `audit_log(userId)`, `audit_log(workspaceId)` — audit queries
  - `notifications(userId, readAt)` — unread notification count
  - `tags(projectId)` — tag lookups
  - `note_tags(noteId)`, `note_tags(tagId)` — tag filter joins
  - `insight_evidence(quoteId)` — "insights linked to quote" lookups
  - `insight_cards(projectId, createdBy)` — author filtering
- Generate and run a migration after adding indexes

#### P2. Query optimization (specific hot paths)
**Priority: HIGH**
**Files:** `src/lib/queries/*.ts`
- **O(n²) connection counting** in `src/lib/queries/map.ts` (lines 46-48): `getMapData()` does `connectionRows.filter(c => c.sourceNodeId === node.id || c.targetNodeId === node.id).length` inside a loop over all nodes. Pre-compute a `Map<nodeId, count>` in a single pass instead.
- **Stacked correlated EXISTS subqueries** in `src/lib/queries/vault-list.ts` (lines 137-147): Each tag filter adds a separate `EXISTS (SELECT 1 FROM note_tags...)`. With 5 tags = 5 correlated subqueries. Refactor to single JOIN with `GROUP BY ... HAVING COUNT(*) = tagCount`.
- **Duplicated subquery in SELECT + ORDER BY** in `src/lib/queries/stack.ts` (lines 98-104): `solutionLabel` subquery runs twice per row (once in SELECT, once in ORDER BY). Use a CTE or window function to avoid duplication.
- **Sequential dependency chain** in `src/lib/queries/engine.ts` (lines 93-107): Query 4 only executes if `insightNodeRow[0]` exists, creating a waterfall. Restructure to `Promise.allSettled` or eager JOIN.
- Add `select()` to queries that return entire rows when only a few columns are needed

#### P3. Dynamic imports for heavy client components
**Priority: MEDIUM**
**Files:** Map canvas (508 lines), Tiptap editor (221 lines), Engine list (478 lines)
- No `dynamic()` or `React.lazy()` is used anywhere in the codebase
- Lazy-load with `next/dynamic({ ssr: false })`:
  - `MapCanvas` — pan/zoom/drag + SVG rendering
  - `NoteEditor` — Tiptap ecosystem (~80KB gzipped: StarterKit, Highlight, Link, Placeholder, CharacterCount)
  - `CreateInsightForm` — depends on Tiptap
  - `CreateNodeSlideover` — only shown on button click
  - `MapSearchOverlay` — only shown on ⌘K
  - `MapMinimap` — secondary UI, not critical path
- Add loading skeletons as fallback for each

#### P4. Loading states and Suspense boundaries
**Priority: MEDIUM**
**Files:** `src/app/(app)/[workspaceId]/[projectId]/**/page.tsx`
- No `loading.tsx` files exist — users see nothing during navigation
- Add `loading.tsx` for: vault, engine, map, stack, team pages
- Use skeleton UI matching the final layout shape
- Add Suspense boundaries around data-dependent sections within pages

#### P5. Image optimization
**Priority: MEDIUM**
- Raw `<img>` tags found throughout — no `next/image` usage anywhere:
  - `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx` — auth pages
  - `src/app/(setup)/onboarding/onboarding-wizard.tsx` — onboarding
  - `src/components/comments/comment-thread.tsx` — user avatars in comments
  - `src/components/layout/workspace-switcher.tsx` — workspace logos
  - `src/components/layout/topbar.tsx` — user menu avatar
  - `src/components/team/member-table.tsx` — member avatars
  - `src/components/presence/presence-avatars.tsx` — presence indicators
- Replace all with `next/image`, add `placeholder="blur"`, explicit `width`/`height`
- Configure `remotePatterns` in next.config for Google avatar URLs and workspace logos

#### P6. Memoization for list components
**Priority: LOW**
- `src/components/vault/vault-list.tsx` — `NoteCard` rendered in `.map()` without `React.memo`. Parent state changes re-render all cards.
- `src/components/engine/engine-list-page.tsx` — same pattern with insight cards
- Wrap card components in `React.memo()`
- Consider `useMemo` for filtered/sorted lists

#### P7. Query caching
**Priority: LOW**
- No `unstable_cache()` or React `cache()` usage detected anywhere
- Read-heavy queries (`getVaultList`, `getEngineList`, `getStackItems`) are not cached between requests
- Wrap expensive queries in `unstable_cache()` with `revalidateTag()` for granular invalidation
- Replace broad `revalidatePath("/(app)", "layout")` with targeted tag-based invalidation

#### P8. Font loading (VERIFIED OK)
- `src/lib/fonts.ts` uses `next/font/google` with `display: "swap"` on all 3 fonts — no action needed

---

### Phase 3: Resilience & Error Handling

#### R1. Error boundaries per phase
**Priority: HIGH**
**Files:** `src/app/(app)/[workspaceId]/[projectId]/{vault,engine,map,stack,team}/error.tsx`
- Only one global `error.tsx` exists at `src/app/error.tsx`
- Add phase-specific error boundaries that:
  - Show contextual error message (e.g., "Map failed to load")
  - Report to Sentry with phase context
  - Offer "Try again" that resets the boundary
  - Use design system tokens (current global error has hardcoded hex colors)

#### R2. Fix global error.tsx hardcoded styles
**Priority: LOW**
**File:** `src/app/error.tsx`
- Uses hardcoded `#666`, `#E8C547`, `#0C0C0F` — replace with CSS variables
- Add design system fonts

#### R3. Graceful degradation for failed fetches
**Priority: MEDIUM**
- Client components that fetch via `useEffect` (e.g., `insight-card-expanded.tsx`) should show meaningful error states, not just "not found"
- Add retry logic with exponential backoff for transient failures
- Show toast notifications for failed mutations instead of silent failures

#### R4. Optimistic updates for common mutations
**Priority: MEDIUM**
- Comment creation, node dragging, RICE score editing — these should update the UI immediately and revert on failure
- Use React 19 `useOptimistic` or React Query's optimistic mutation pattern

---

### Phase 4: Code Quality & DX

#### Q1. Date serialization safety layer
**Priority: HIGH**
**Affected query files:** `src/lib/queries/vault.ts` (lines 40-41), `src/lib/queries/engine.ts` (lines 20-21), `src/lib/queries/vault-list.ts` (line 17), `src/lib/queries/comments.ts` (lines 13-14, 24-25)
**Affected client components:** `insight-card.tsx`, `comment-thread.tsx`, `note-card.tsx`, `stack-page.tsx`, `notification-bell.tsx`
- Query types declare `createdAt: Date`, `updatedAt: Date` etc. but these become strings when serialized to client
- Create a `serializeDates` utility that converts Date fields to ISO strings at the server boundary
- Create corresponding `parseDates` for client hydration
- Or: define Zod schemas for serialized types and use `.transform()` to parse dates on the client
- Apply consistently to all query return types passed to client components

#### Q2. Strict TypeScript boundary types
**Priority: MEDIUM**
- Define explicit `Serialized<T>` type that maps `Date` → `string` for server-to-client props
- This catches Date serialization bugs at compile time instead of runtime

#### Q3. Remaining hardcoded hex colors
**Priority: MEDIUM**
**Files:**
- `src/components/integrations/integration-cards.tsx` (lines 27, 35, 43, 51) — `#0052CC` (Jira), `#5E6AD2` (Linear), `#4A154B` (Slack)
- `src/app/error.tsx` (lines 29, 33) — `#E8C547`, `#0C0C0F`, `#666`
- `src/app/(app)/[workspaceId]/settings/danger-zone.tsx` — `#e07356`, `#fff`
- `src/app/(auth)/login/login-form.tsx`, `signup-form.tsx` — `#4285F4` (Google blue)
- `src/app/not-found.tsx` — `#666`
- **Fix:** Move integration brand colors to `src/styles/tokens.css` as `--color-brand-jira`, `--color-brand-linear`, etc. Fix error/not-found pages to use CSS variables.

#### Q4. Accessibility gaps
**Priority: MEDIUM**
- `src/components/engine/engine-list-page.tsx` (line 222-233) — search input has `placeholder` but no `aria-label`
- Several custom dropdowns use `<div>` instead of `<ul role="listbox">` pattern
- Some interactive buttons missing descriptive `aria-label`
- Inconsistent `focus-visible:ring-offset` on dark backgrounds

#### Q5. Shared auth wrapper library
**Priority: MEDIUM**
**File:** `src/lib/permissions/guard.ts`
- Extend `withPermission` to handle workspace-level actions (not just phase-scoped)
- Create `withAuth` for simple authenticated-only actions (no phase/workspace check)
- Create `withWorkspacePermission` for workspace-level mutations
- Reduce boilerplate across all 16 action files

#### Q6. Test coverage expansion
**Priority: MEDIUM**
- Add integration tests for every Server Action (test auth, validation, IDOR protection)
- Add E2E tests for critical user flows: onboarding → create project → vault → engine → map → stack
- Test error boundaries render correctly
- Test Date serialization round-trips

#### Q7. Logging and observability
**Priority: LOW**
- Add structured logging (Pino) to all Server Actions — log action name, userId, duration
- Add performance timing to database queries
- Configure Sentry performance monitoring (traces) for server-side rendering

---

### Implementation Order

When I say "implement Sprint N", follow this priority order:

| Sprint | Items | Impact |
|--------|-------|--------|
| 1 | S2 (token encryption), S3 (OAuth CSRF), S4 (map API auth), S1 (auth guards) | **CRITICAL security — must fix before production** |
| 2 | P1 (database indexes), S8 (IDOR audit), S7 (input validation) | Security + performance foundation |
| 3 | S5 (rate limits), S6 (headers), P2 (query hot paths) | Security hardening + performance |
| 4 | Q1 (date safety), R1 (error boundaries), P4 (loading states) | Resilience + UX |
| 5 | P3 (dynamic imports), P5 (images), Q3 (hardcoded colors), Q5 (auth wrappers) | Performance + quality |
| 6 | R3 (error handling), R4 (optimistic updates), Q2 (boundary types), Q4 (accessibility) | Polish |
| 7 | Q6 (tests), Q7 (logging), P6 (memoization), P7 (query caching), S9 (cookies), R2 (error styles) | Cleanup + observability |