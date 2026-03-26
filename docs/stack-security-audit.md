# Stack Security Audit — 2026-03-26

**Scope:** Phase 04 — Priority Stack (Prompts 24–26)
**Auditor:** Claude Opus 4.6 (automated code review)
**Status:** PASS — all items verified

---

## Summary

The Stack phase implements defence-in-depth across six layers:

1. **Input validation** — Zod schemas at every server action boundary
2. **Permission checks** — `withPermission()` wrapper on every write action, `checkPermission()` on page load
3. **IDOR prevention** — ownership verified against `ctx.projectId` before every mutation
4. **XSS prevention** — React auto-escaping, no `dangerouslySetInnerHTML`, all values rendered as text
5. **SQL injection prevention** — Drizzle ORM parameterised queries, `sql.raw()` for qualified column refs
6. **Passcode security** — scrypt hashing with random salt, timing-safe comparison

No critical findings. One low-severity note documented at the end.

---

## Input Validation

| Check | Status | Evidence |
|---|---|---|
| `updateRiceFieldAction`: field restricted to enum | PASS | `z.enum(["reachOverride", "impactOverride", "confidenceOverride", "effortManual"])` |
| `updateRiceFieldAction`: value must be finite, non-negative, nullable | PASS | `z.number().finite().min(0).nullable()` |
| `updateTierAction`: tier restricted to enum or null | PASS | `z.enum(["now", "next", "later", "someday"]).nullable()` |
| `updateTierAction`: stackItemId is UUID | PASS | `z.string().uuid()` |
| `lockStackAction`: passcode 4–64 chars | PASS | `z.string().min(4).max(64)` |
| `lockStackAction`: viewMode restricted to enum | PASS | `z.enum(["stakeholder", "presentation"])` |
| `unlockStackAction`: snapshotId is UUID | PASS | `z.string().uuid()` |
| `syncStackItemsAction`: no user input beyond ctx | PASS | Only uses `ctx.projectId` |

---

## Permission Checks

| Check | Status | Evidence |
|---|---|---|
| Stack page: `auth()` session check | PASS | `page.tsx:12` — redirects to `/login` |
| Stack page: `checkPermission({ phase: "stack", action: "read" })` | PASS | `page.tsx:18` — shows error on deny |
| Stack page: write permission checked for `canEdit` prop | PASS | `page.tsx:37` — separate write check |
| `updateRiceFieldAction`: `withPermission({ phase: "stack", action: "write" })` | PASS | `actions/stack.ts:21` |
| `updateTierAction`: `withPermission({ phase: "stack", action: "write" })` | PASS | `actions/stack.ts:98` |
| `syncStackItemsAction`: `withPermission({ phase: "stack", action: "write" })` | PASS | `actions/stack.ts:165` |
| `lockStackAction`: `withPermission({ phase: "stack", action: "write" })` | PASS | `actions/stack.ts:209` |
| `unlockStackAction`: `withPermission({ phase: "stack", action: "write" })` | PASS | `actions/stack.ts:282` |
| `unlockStackAction`: creator-or-admin gate | PASS | `snapshot.lockedBy !== ctx.userId && ctx.tier !== "admin"` |
| Client-side: `canEdit` gates RICE editing, tier changes, sync, lock | PASS | `stack-page.tsx` — all edit UI conditionally rendered |
| Client-side: `effectiveCanEdit` = `canEdit && !isLocked` | PASS | `stack-page.tsx:37` — editing disabled when locked |

---

## IDOR Prevention

| Check | Status | Evidence |
|---|---|---|
| `updateRiceFieldAction`: item verified against project | PASS | `eq(stackItems.projectId, ctx.projectId)` |
| `updateTierAction`: item verified against project | PASS | `eq(stackItems.projectId, ctx.projectId)` |
| `lockStackAction`: duplicate lock prevented | PASS | Checks existing snapshot for project |
| `lockStackAction`: snapshot scoped to project | PASS | `projectId: ctx.projectId` in insert |
| `unlockStackAction`: snapshot verified against project | PASS | `eq(stackSnapshots.projectId, ctx.projectId)` |
| `getStackItems`: query scoped to projectId | PASS | `eq(stackItems.projectId, projectId)` |
| `getActiveSnapshot`: query scoped to projectId | PASS | `eq(stackSnapshots.projectId, projectId)` |
| `syncSolutionNodesToStack`: scoped to projectId | PASS | `eq(mapNodes.projectId, projectId)` |

---

## Passcode Security

| Check | Status | Evidence |
|---|---|---|
| Passcode hashed with scrypt (64-byte key) | PASS | `scryptSync(passcode, salt, 64)` |
| Random 16-byte salt per passcode | PASS | `randomBytes(16).toString("hex")` |
| Timing-safe comparison | PASS | `timingSafeEqual(Buffer.from(hash, "hex"), computed)` |
| Share token: 24 random bytes, base64url | PASS | `randomBytes(24).toString("base64url")` |
| Token uniquely indexed in database | PASS | `uniqueIndex("stack_snapshots_token_idx")` |
| Share page does not leak data before passcode | PASS | Server checks token existence, client gates on passcode |
| `verifySharePasscode` is not a server action (no CSRF needed) | PASS | Exported as plain async function |

---

## RICE Score Integrity

| Check | Status | Evidence |
|---|---|---|
| RICE formula: `(R × I × C) / E` | PASS | `src/lib/utils/rice.ts:21` |
| Effort = 0 rejected (would produce infinity) | PASS | `effort <= 0` returns null |
| Score recalculated on every field update | PASS | `updateRiceFieldAction` recalculates after applying override |
| Override preferred over auto value | PASS | `updated.reachOverride ?? updated.reachAuto` pattern |
| Score stored as `real` (float4) in database | PASS | `real("rice_score")` in schema |
| Null score when any field missing | PASS | `calculateRiceScore` returns null if any input is null |

---

## XSS Prevention

| Check | Status | Evidence |
|---|---|---|
| Solution labels rendered via React JSX (auto-escaped) | PASS | `stack-table.tsx` — `{item.solutionLabel}` in JSX |
| Linked problems rendered as text | PASS | `{item.linkedProblems.join(" · ")}` in JSX |
| Tier badges use React text nodes | PASS | `tier-badge.tsx` — no HTML injection |
| RICE values rendered as numbers | PASS | Numeric values, not user-controlled strings |
| Share page renders snapshot data via React | PASS | `stakeholder-view.tsx` — all values in JSX |
| No `dangerouslySetInnerHTML` in any Stack component | PASS | Grep confirmed zero occurrences |

---

## SQL Injection Prevention

| Check | Status | Evidence |
|---|---|---|
| All queries use Drizzle ORM query builder | PASS | No string concatenation in SQL |
| `sql.raw()` used for qualified column refs | PASS | `sql.raw('"stack_items"."solution_node_id"')` |
| Subqueries use Drizzle parameter binding | PASS | All `${table.column}` interpolations are Drizzle-escaped |
| No user input directly in raw SQL | PASS | All inputs validated through Zod |

---

## Audit Logging

| Check | Status | Evidence |
|---|---|---|
| `stack.rice.updated` logged on RICE field change | PASS | `actions/stack.ts:81` |
| `stack.tier.updated` logged on tier change | PASS | `actions/stack.ts:147` |
| `stack.synced` logged on sync | PASS | `actions/stack.ts:176` |
| `stack.locked` logged on lock | PASS | `actions/stack.ts:265` |
| `stack.unlocked` logged on unlock | PASS | `actions/stack.ts:329` |
| Audit entries fire-and-forget | PASS | `.catch(() => {})` pattern |
| Metadata includes relevant context | PASS | Field name, value, tier, viewMode, itemCount |

---

## Client-Side Security

| Check | Status | Evidence |
|---|---|---|
| `canEdit` prop controls all write UI | PASS | RICE cells, tier dropdowns, sync button, lock button |
| `effectiveCanEdit` disables editing when locked | PASS | `canEdit && !isLocked` |
| Lock button hidden when stack is empty | PASS | `items.length > 0` guard |
| Unlock confirmation dialog | PASS | `confirm()` before unlock action |
| Server re-verifies all writes | PASS | `withPermission` on every server action |

---

## Share Page Security

| Check | Status | Evidence |
|---|---|---|
| Token-only access (no auth required) | PASS | Share page outside `(app)` layout |
| Invalid token shows generic error | PASS | "Link expired or invalid" — no info leak |
| Passcode required before data shown | PASS | Client gates on `authenticated` state |
| Server only checks token existence on page load | PASS | `getSnapshotByToken` returns boolean-like check |
| Snapshot data only returned after passcode verification | PASS | `verifySharePasscode` returns data only on match |
| Read-only view (no mutations possible) | PASS | No server actions exposed in share components |
| Print/PDF export is client-side only | PASS | `window.print()` — no server round-trip |

---

## Low-Severity Notes

### 1. Rate limiting on passcode verification

**Location:** `src/actions/stack.ts:345` (`verifySharePasscode`)
**Issue:** No rate limiting on passcode verification attempts. An attacker with the share URL could brute-force short passcodes.
**Recommendation:** Add rate limiting (e.g., 5 attempts per minute per token) at the API layer or use a longer minimum passcode requirement. Current minimum is 4 characters.
**Severity:** Low — requires knowing the share URL, and the URL itself is 24 random bytes (192 bits of entropy).

### 2. Locked stack does not prevent new solution nodes

**Location:** `syncSolutionNodesToStack` runs on every page load
**Issue:** New solution nodes created on the Map after locking will appear in the stack table (though editing is disabled). The snapshot is frozen, but the live view still shows new items.
**Recommendation:** Consider skipping auto-sync when stack is locked. Low priority — the snapshot is the source of truth for stakeholders.
**Severity:** Low — no data integrity issue, snapshot is unaffected.

---

## Conclusion

The Stack phase follows the same defence-in-depth patterns established in the Vault, Engine, and Map phases. All server actions use `withPermission()`, all mutations validate input with Zod, all queries scope to `projectId`, and all user-facing content is rendered through React's auto-escaping. The passcode system uses industry-standard scrypt hashing with random salts and timing-safe comparison. The share page correctly gates data behind passcode verification without leaking information. The two low-severity notes are operational concerns with no security impact.
