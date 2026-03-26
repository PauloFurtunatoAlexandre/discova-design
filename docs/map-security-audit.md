# Map Security Audit — 2026-03-26

**Scope:** Phase 03 — Opportunity Map (Prompts 20–22)
**Auditor:** Claude Opus 4.6 (automated code review)
**Status:** PASS — all items verified

---

## Summary

The Map phase implements defence-in-depth across five layers:

1. **Input validation** — Zod schemas at every server action boundary
2. **Permission checks** — `withPermission()` wrapper on every write action, `checkPermission()` on page load
3. **IDOR prevention** — ownership verified against `ctx.projectId` before every mutation
4. **XSS prevention** — React auto-escaping, no `dangerouslySetInnerHTML`, labels/descriptions rendered as text
5. **SQL injection prevention** — Drizzle ORM parameterised queries, no raw string concatenation

No critical findings. One low-severity note documented at the end.

---

## Input Validation

| Check | Status | Evidence |
|---|---|---|
| `createMapNodeAction`: Zod validates type, label, description | PASS | `src/lib/validations/map.ts` — `createMapNodeSchema` |
| `createMapNodeAction`: type restricted to `problem` or `solution` | PASS | `z.enum(["problem", "solution"])` |
| `createMapNodeAction`: label 1–300 chars, trimmed | PASS | `z.string().min(1).max(300).trim()` |
| `createMapNodeAction`: description max 1000 chars, nullable | PASS | `z.string().max(1000).trim().optional().nullable().transform(v => v \|\| null)` |
| `createConnectionAction`: both node IDs are UUIDs | PASS | `z.string().uuid()` for both sourceNodeId and targetNodeId |
| `createConnectionAction`: self-connection rejected | PASS | `sourceNodeId === targetNodeId` check |
| `updateNodePositionAction`: position must be finite numbers | PASS | `z.number().finite()` for positionX and positionY |
| `deleteMapNodeSchema`: nodeId is UUID | PASS | `z.string().uuid()` |
| `deleteConnectionSchema`: connectionId is UUID | PASS | `z.string().uuid()` |
| `placeInsightOnMapAction`: duplicate placement rejected | PASS | Checks for existing map node with same insightId |

**Test coverage:** `src/__tests__/map/map-actions.test.ts` (24 test cases covering all schemas + direction rules)

---

## Permission Checks

| Check | Status | Evidence |
|---|---|---|
| Map page: `auth()` session check | PASS | `src/app/(app)/[workspaceId]/[projectId]/map/page.tsx:14` — redirects to `/login` |
| Map page: `checkPermission({ phase: "map", action: "read" })` | PASS | `page.tsx:19` — redirects to workspace on deny |
| Map page: write permission checked for `canEdit` prop | PASS | `page.tsx:28` — separate write permission check |
| Map page: unplaced insights only fetched with write permission | PASS | `page.tsx:38` — conditional fetch |
| `createMapNodeAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:19` |
| `createConnectionAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:76` |
| `deleteMapNodeAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:163` |
| `deleteMapNodeAction`: creator-or-admin gate | PASS | `node.createdBy !== ctx.userId && ctx.tier !== "admin"` |
| `deleteConnectionAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:216` |
| `updateNodePositionAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:271` |
| `placeInsightOnMapAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/map.ts:314` |
| Client-side: `canEdit` gates FAB, context menu, drag handles | PASS | `map-canvas.tsx` — all edit UI conditionally rendered |

**Test coverage:** `e2e/map/map-permissions.spec.ts`, `e2e/map/map-security.spec.ts`

---

## IDOR Prevention

| Check | Status | Evidence |
|---|---|---|
| `createMapNodeAction`: node created with `ctx.projectId` | PASS | `projectId: ctx.projectId` in insert values |
| `createConnectionAction`: both nodes verified against project | PASS | `eq(mapNodes.projectId, ctx.projectId)` on both source and target |
| `deleteMapNodeAction`: node verified against project | PASS | `eq(mapNodes.projectId, ctx.projectId)` |
| `deleteMapNodeAction`: delete scoped to project | PASS | Double-check in delete WHERE clause |
| `deleteConnectionAction`: connection verified against project | PASS | `eq(mapConnections.projectId, ctx.projectId)` |
| `updateNodePositionAction`: update scoped to project | PASS | `eq(mapNodes.projectId, ctx.projectId)` in WHERE clause |
| `placeInsightOnMapAction`: insight verified against project | PASS | `eq(insightCards.projectId, ctx.projectId)` |
| `placeInsightOnMapAction`: existing placement check scoped | PASS | `eq(mapNodes.projectId, ctx.projectId)` |
| `getMapData`: query scoped to projectId | PASS | `eq(mapNodes.projectId, projectId)` + `eq(mapConnections.projectId, projectId)` |
| `getUnplacedInsights`: query scoped to projectId | PASS | `eq(insightCards.projectId, projectId)` |

**Test coverage:** `e2e/map/map-security.spec.ts` (data isolation tests)

---

## Connection Direction Validation

| Check | Status | Evidence |
|---|---|---|
| `insight → problem`: allowed | PASS | `validConnections.insight = ["problem", "solution"]` |
| `insight → solution`: allowed | PASS | Same array |
| `problem → solution`: allowed | PASS | `validConnections.problem = ["solution"]` |
| `solution → anything`: blocked | PASS | `validConnections.solution` is undefined — fails `allowed?.includes()` |
| `problem → insight`: blocked | PASS | "insight" not in `validConnections.problem` |
| `problem → problem`: blocked | PASS | "problem" not in `validConnections.problem` |
| Self-connection: blocked | PASS | Explicit `sourceNodeId === targetNodeId` check before direction validation |

**Test coverage:** `src/__tests__/map/map-actions.test.ts` (6 direction rule tests)

---

## XSS Prevention

| Check | Status | Evidence |
|---|---|---|
| Node label rendered via React JSX (auto-escaped) | PASS | `map-node.tsx:181` — `{node.label}` in JSX |
| Node description rendered via React JSX | PASS | `map-node.tsx:200` — `{node.description}` in JSX |
| Search results rendered via React JSX | PASS | `map-search-overlay.tsx:164` — `{node.label}` in JSX |
| Context menu: node label not rendered as HTML | PASS | `node-context-menu.tsx` uses React text nodes |
| Create form: controlled inputs, no HTML injection | PASS | `create-node-slideover.tsx` uses `value={label}` controlled components |
| No `dangerouslySetInnerHTML` in any Map component | PASS | Grep confirmed zero occurrences |
| Unplaced insights panel: statement rendered as text | PASS | `unplaced-insights-panel.tsx` uses `{insight.statement}` in JSX |

**Test coverage:** `e2e/map/map-security.spec.ts` (XSS tests for label and description)

---

## SQL Injection Prevention

| Check | Status | Evidence |
|---|---|---|
| All queries use Drizzle ORM query builder | PASS | No string concatenation in SQL |
| All `sql` template literals use Drizzle parameter binding | PASS | `${table.column}` interpolations are Drizzle-escaped |
| Raw SQL column references fully qualified | PASS | Fixed in ambiguous-id patch — all use `table.column` syntax |
| No user input directly concatenated into queries | PASS | All inputs validated through Zod before use |

---

## Node State Derivation

| Check | Status | Evidence |
|---|---|---|
| `deriveBaseState` is pure function (no side effects) | PASS | `src/lib/queries/map.ts:101` — operates on arrays, returns string |
| Insight: connected if outgoing > 0, else unconnected | PASS | Verified in logic |
| Problem: connected if any connections, else unconnected | PASS | Checks both incoming + outgoing |
| Solution: connected if incoming > 0, else orphan | PASS | Orphan state triggers warning icon |
| Default case returns "unconnected" | PASS | Fallback for unexpected types |

**Test coverage:** `src/__tests__/map/node-state.test.ts` (10 test cases)

---

## Audit Logging

| Check | Status | Evidence |
|---|---|---|
| `map.node.created` logged on node creation | PASS | `src/actions/map.ts:59` |
| `map.connection.created` logged on connection creation | PASS | `src/actions/map.ts:143` |
| `map.node.deleted` logged on node deletion | PASS | `src/actions/map.ts:199` |
| `map.connection.deleted` logged on connection deletion | PASS | `src/actions/map.ts:255` |
| `map.insight.placed` logged on insight placement | PASS | `src/actions/map.ts:364` |
| Position updates: no audit log (high-frequency drag) | PASS | Intentional — position changes are too frequent to log |
| Audit entries fire-and-forget (`.catch(() => {})`) | PASS | Non-blocking, failure doesn't break user flow |
| Label truncated to 100 chars in metadata | PASS | `.slice(0, 100)` in create audit call |

---

## Client-Side Security

| Check | Status | Evidence |
|---|---|---|
| `canEdit` prop controls all write UI | PASS | FAB, context menu, drag handles, slide-over all gated |
| Drag-to-connect only works when `canEdit` | PASS | Handles only rendered when `isSelected && canEdit` |
| Node drag only works when `canEdit` | PASS | `handleMouseDown` checks `canEdit` before initiating drag |
| Context menu only on `canEdit` | PASS | `handleNodeContextMenu` returns early if `!canEdit` |
| Server re-verifies all writes | PASS | `withPermission` on every server action |

---

## Layout & Rendering Security

| Check | Status | Evidence |
|---|---|---|
| `calculateLayout` is pure function | PASS | No side effects, operates on input array |
| Node positions use finite number validation | PASS | `z.number().finite()` rejects Infinity/NaN |
| SVG connection lines are decorative (`aria-hidden`) | PASS | `map-canvas.tsx:353` — `aria-hidden="true"` |
| Minimap uses relative scaling (no absolute positioning leak) | PASS | `map-minimap.tsx` — scales relative to content bounds |

---

## Low-Severity Notes

### 1. `updateNodePositionAction` does not log audit entries

**Location:** `src/actions/map.ts:271`
**Issue:** Position updates are fire-and-forget with no audit trail. This is intentional to avoid flooding the audit log during drag operations, but means position history is not recoverable.
**Recommendation:** Consider batch-logging final positions at drag-end intervals (e.g., throttled to 1 entry per node per minute). Low priority — position data is stored in the database.
**Severity:** Low — no security impact, minor observability gap.

---

## Conclusion

The Map phase follows the same defence-in-depth patterns established in the Vault and Engine phases. All server actions use `withPermission()`, all mutations validate input with Zod, all queries scope to `projectId`, and all user-facing content is rendered through React's auto-escaping. Connection direction validation prevents invalid graph structures. The node state derivation is a pure function with thorough test coverage. The one low-severity note is an intentional design decision with no security impact.
