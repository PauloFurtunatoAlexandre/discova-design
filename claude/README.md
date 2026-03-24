# Discova

> The missing layer between what your users say and what your team decides to build.

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL (or Supabase account)
- Upstash Redis account
- Anthropic API key

### Setup

```bash
# Clone and install
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in all required values in .env.local

# Set up database
pnpm db:generate   # Generate initial migration
pnpm db:migrate    # Run migrations

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

See `CLAUDE.md` for the full context file used by Claude Code.

Key directories:

| Path | Purpose |
|------|---------|
| `src/app/(auth)/` | Login, signup, onboarding |
| `src/app/(app)/` | Protected app — all 5 phases |
| `src/app/share/` | Public stakeholder share view |
| `src/actions/` | Server Actions — one file per domain |
| `src/lib/db/schema/` | Drizzle schema — source of truth for data model |
| `src/lib/auth/permissions.ts` | `resolvePreset()` and `can()` — always use these |
| `src/lib/ai/client.ts` | Anthropic SDK singleton |
| `src/styles/globals.css` | Tailwind + design tokens |
| `src/styles/map-nodes.css` | Map node visual state tokens |
| `src/types/index.ts` | All TypeScript types — inferred from Drizzle schema |

---

## The Five Phases

| # | Name   | Route     | Primary user |
|---|--------|-----------|--------------|
| 1 | Vault  | `/vault`  | Researcher |
| 2 | Engine | `/engine` | Researcher |
| 3 | Map    | `/map`    | Both |
| 4 | Stack  | `/stack`  | PM |
| 5 | Team   | `/team`   | Admin/PM |

---

## Commands

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # Biome lint
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # TypeScript check
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Open Drizzle Studio
pnpm test             # Run Vitest
```

---

## Docs

- [`CLAUDE.md`](./CLAUDE.md) — Full context for Claude Code
- [`docs/prd.md`](./docs/prd.md) — Product requirements document
- [`docs/permissions-schema.md`](./docs/permissions-schema.md) — Permissions data model
- [`docs/map-node-tokens.md`](./docs/map-node-tokens.md) — Map node visual state tokens

---

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · PostgreSQL ·
Auth.js · Anthropic SDK · Upstash Redis · BullMQ · Framer Motion · shadcn/ui · Biome
