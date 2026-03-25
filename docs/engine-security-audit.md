# Engine Security Audit — 2026-03-25

**Scope:** Phase 02 — Insight Engine (Prompts 15–18)
**Auditor:** Claude Opus 4.6 (automated code review)
**Status:** PASS — all items verified

---

## Summary

The Engine phase implements defence-in-depth across five layers:

1. **Input validation** — Zod schemas at every server action boundary
2. **Permission checks** — `withPermission()` wrapper on every write action, `checkPermission()` on API routes
3. **IDOR prevention** — ownership verified against `ctx.projectId` before every mutation + cross-entity checks
4. **XSS prevention** — React auto-escaping, no `dangerouslySetInnerHTML`, theme tags rendered as text
5. **SQL injection prevention** — Drizzle ORM parameterised queries, `ilike()` for search

No critical findings. Two low-severity notes documented at the end.

---

## Input Validation

| Check | Status | Evidence |
|---|---|---|
| `acceptInsightAction`: Zod validates all fields | PASS | `src/lib/validations/insights.ts` — `acceptInsightSchema` |
| `acceptInsightAction`: `statement` max 500 chars, trimmed | PASS | `z.string().min(1).max(500).trim()` |
| `acceptInsightAction`: `themeTag` max 50 chars, nullable | PASS | `z.string().max(50).trim().optional().nullable()` |
| `acceptInsightAction`: `evidenceQuoteIds` array of UUIDs, max 50 | PASS | `z.array(z.string().uuid()).min(0).max(50)` |
| `acceptInsightAction`: `problemNodeId` UUID or null | PASS | `z.string().uuid().optional().nullable()` |
| `createManualInsightAction`: same validation as accept | PASS | `createManualInsightSchema` mirrors acceptInsightSchema |
| `updateInsightAction`: `insightId` UUID required | PASS | `z.string().uuid()` |
| `updateInsightAction`: partial update fields validated | PASS | Both `statement` and `themeTag` optional but validated when present |
| `createProblemAndLinkAction`: `label` 1–300 chars | PASS | `z.string().min(1).max(300).trim()` |
| `createProblemAndLinkAction`: `description` max 1000, nullable | PASS | `z.string().max(1000).trim().optional().nullable()` |
| Engine API route: `limit` parsed as integer | PASS | `Number.parseInt(…, 10)` with fallback to 20 |
| Engine API route: `confMin`/`confMax` parsed as integers | PASS | Explicit `Number.parseInt` conversion |
| Engine API route: `sortBy` cast to enum type | PASS | Cast to `EngineListFilters["sortBy"]` — invalid values fall through to default |

**Test coverage:** `src/__tests__/engine/confidence.test.ts`, `src/__tests__/engine/engine-list.test.ts`, `src/__tests__/engine/engine-integration.test.ts`

---

## Permission Checks

| Check | Status | Evidence |
|---|---|---|
| `acceptInsightAction`: `withPermission({ phase: "engine", action: "write" })` | PASS | `src/actions/insights.ts:26` |
| `createManualInsightAction`: `withPermission({ phase: "engine", action: "write" })` | PASS | `src/actions/insights.ts:377` |
| `updateInsightAction`: `withPermission({ phase: "engine", action: "write" })` | PASS | `src/actions/insights.ts:508` |
| `deleteInsightAction`: `withPermission({ phase: "engine", action: "write" })` | PASS | `src/actions/insights.ts:574` |
| `updateInsightAction`: creator-or-admin gate | PASS | `insight.createdBy !== ctx.userId && ctx.tier !== "admin"` |
| `deleteInsightAction`: creator-or-admin gate | PASS | `insight.createdBy !== ctx.userId && ctx.tier !== "admin"` |
| `linkInsightToProblemAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/insights.ts:205` |
| `createProblemAndLinkAction`: `withPermission({ phase: "map", action: "write" })` | PASS | `src/actions/insights.ts:278` |
| Engine API GET: `auth()` session check | PASS | `src/app/api/engine/insights/route.ts:8` — returns 401 |
| Engine API GET: `checkPermission({ phase: "engine", action: "read" })` | PASS | `src/app/api/engine/insights/route.ts:21` — returns 403 |
| Engine API GET: `workspaceId` + `projectId` required | PASS | Returns 400 if either missing |

**Test coverage:** `e2e/engine/engine-permissions.spec.ts`, `e2e/engine/engine-security.spec.ts`

---

## IDOR Prevention

| Check | Status | Evidence |
|---|---|---|
| `acceptInsightAction`: evidenceQuoteIds verified against project | PASS | Joins `quotes → research_notes` and checks `projectId` |
| `acceptInsightAction`: problemNodeId verified against project | PASS | `eq(mapNodes.projectId, ctx.projectId)` |
| `createManualInsightAction`: same IDOR checks as accept | PASS | Identical evidence + problem verification |
| `updateInsightAction`: insight verified against project | PASS | `eq(insightCards.projectId, ctx.projectId)` |
| `deleteInsightAction`: insight verified against project | PASS | `eq(insightCards.projectId, ctx.projectId)` |
| `deleteInsightAction`: map node deletion scoped to project | PASS | `eq(mapNodes.projectId, ctx.projectId)` |
| `linkInsightToProblemAction`: problem + insight both verified | PASS | Both checked against `ctx.projectId` |
| `getEngineList`: query scoped to projectId | PASS | `eq(insightCards.projectId, projectId)` is first condition |
| `getProjectThemeTags`: scoped to projectId | PASS | `eq(insightCards.projectId, projectId)` |
| `getProjectInsightAuthors`: scoped to projectId | PASS | `eq(insightCards.projectId, projectId)` |
| Cross-workspace: API requires workspace membership | PASS | `checkPermission` calls `getTier(userId, workspaceId)` — returns null for non-members |

**Test coverage:** `e2e/engine/engine-security.spec.ts` (IDOR and data isolation tests)

---

## XSS Prevention

| Check | Status | Evidence |
|---|---|---|
| Insight statement rendered via React JSX (auto-escaped) | PASS | `insight-card.tsx` — `{insight.statement}` in JSX |
| Theme tag rendered via React JSX (auto-escaped) | PASS | `{insight.themeTag}` in JSX, no `dangerouslySetInnerHTML` |
| Search input value reflected safely | PASS | Controlled input via `useState`, not injected into HTML |
| Create form: textarea content is form state, not HTML | PASS | `value={statement}` controlled component |
| Filter bar: dropdown values from server, rendered as text | PASS | `<option>{tag}</option>` — React escapes option children |
| Confidence ring: score rendered as number in SVG text | PASS | `{score}` in `<text>` element |
| No `dangerouslySetInnerHTML` in any Engine component | PASS | Grep confirmed zero occurrences |

**Test coverage:** `e2e/engine/engine-security.spec.ts` (XSS tests for statement and theme tag)

---

## SQL Injection Prevention

| Check | Status | Evidence |
|---|---|---|
| Search uses Drizzle `ilike()` with parameterised value | PASS | `ilike(insightCards.statement, term)` — Drizzle binds params |
| Filter values pass through Drizzle column comparisons | PASS | `eq()`, `gte()`, `lte()` all parameterised |
| Cursor values parsed before use in raw SQL | PASS | `Number(cursorValue)` and UUID string — used as bound params via `${}` template literals in `sql` tagged template |
| No string concatenation in SQL queries | PASS | All queries use Drizzle query builder or `sql` tagged template |
| Raw `sql` template: all interpolations use Drizzle parameter binding | PASS | `${insightCards.id}`, `${cursorValue}` etc. are Drizzle-escaped |

**Test coverage:** `e2e/engine/engine-security.spec.ts` (SQL injection test)

---

## Confidence Algorithm Security

| Check | Status | Evidence |
|---|---|---|
| Score capped at 90 (never 100%) | PASS | `Math.min(90, Math.round(score))` |
| Zero evidence returns 0, not undefined/NaN | PASS | Early return `if (evidence.length === 0) return 0` |
| Score is always an integer | PASS | `Math.round()` applied |
| Score is always non-negative | PASS | Only additions to score, starting from 0 |
| Duplicate noteIds counted once (unique sources) | PASS | `Map<string, ...>` deduplication |
| Sentiment multiplier only for "frustrated"/"delighted" | PASS | Strict equality check, all other tones get 1.0x |
| Recalculation triggered on: accept, create, delete quote, tone change | PASS | Four trigger points verified in actions |

**Test coverage:** `src/__tests__/engine/confidence.test.ts` (15 test cases), `src/__tests__/engine/recalculation.test.ts`

---

## API Route Security

| Check | Status | Evidence |
|---|---|---|
| GET `/api/engine/insights`: session required | PASS | `auth()` check, 401 on failure |
| GET `/api/engine/insights`: permission required | PASS | `checkPermission()`, 403 on failure |
| GET `/api/engine/insights`: workspaceId + projectId required | PASS | 400 if missing |
| GET `/api/engine/insights`: no mutation via GET | PASS | Read-only query |
| No POST/PUT/DELETE on engine API route | PASS | Only GET exported |
| Mutations go through server actions with `withPermission` | PASS | All CRUD via server actions |

---

## Audit Logging

| Check | Status | Evidence |
|---|---|---|
| `insight.accepted` logged on AI insight accept | PASS | `createAuditEntry` in `acceptInsightAction` |
| `insight.created` logged on manual creation | PASS | `createAuditEntry` in `createManualInsightAction` |
| `insight.updated` logged on edit | PASS | `createAuditEntry` in `updateInsightAction` |
| `insight.deleted` logged on deletion | PASS | `createAuditEntry` in `deleteInsightAction` |
| `insight.linked` logged on map connection | PASS | `createAuditEntry` in `linkInsightToProblemAction` |
| `problem.created` logged on new problem node | PASS | `createAuditEntry` in `createProblemAndLinkAction` |
| Audit entries fire-and-forget (`.catch(() => {})`) | PASS | Non-blocking, failure doesn't break user flow |
| Statement truncated to 100 chars in metadata | PASS | `.slice(0, 100)` in all audit calls |

---

## Low-Severity Notes

### 1. `sortBy` cast allows arbitrary strings

**Location:** `src/app/api/engine/insights/route.ts:46`
**Issue:** `searchParams.get("sort") as EngineListFilters["sortBy"]` accepts any string at runtime. Invalid values fall through to the `default` case in the switch (confidence_desc), so this is safe but not strict.
**Recommendation:** Add a whitelist check:
```typescript
const validSorts = ["confidence_desc", "confidence_asc", "newest", "oldest", "recently_modified"];
const sortBy = validSorts.includes(raw) ? raw : "confidence_desc";
```
**Severity:** Low — invalid values silently default to confidence_desc.

### 2. `connectionStatus` cast allows arbitrary strings

**Location:** `src/app/api/engine/insights/route.ts:43`
**Issue:** Similar to sortBy — cast allows any string. The query only acts on "connected" or "unconnected", so invalid values effectively mean "all".
**Recommendation:** Validate against the three allowed values.
**Severity:** Low — no data leakage or privilege escalation.

---

## Conclusion

The Engine phase follows the same defence-in-depth patterns established in the Vault phase. All server actions use `withPermission()`, all mutations validate input with Zod, all queries scope to `projectId`, and all user-facing content is rendered through React's auto-escaping. The confidence algorithm is deterministic, bounded, and thoroughly tested. The two low-severity notes are cosmetic strictness improvements with no security impact.
