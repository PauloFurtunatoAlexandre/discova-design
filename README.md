# Discova

**The missing layer between what your users say and what your team decides to build.**

Discova is a product discovery platform that creates a verifiable chain from user research to shipped features — replacing the 4–6 disconnected tools product teams use for research, synthesis, mapping, and prioritisation.

---

## The Five Phases

| # | Phase  | Action     | What it does |
|---|--------|------------|--------------|
| 1 | Vault  | Store      | Capture raw research notes and quotes |
| 2 | Engine | Synthesise | AI-assisted insight card creation |
| 3 | Map    | Connect    | Visual insight → problem → solution graph |
| 4 | Stack  | Decide     | RICE-scored priority ranking |
| 5 | Team   | Align      | Roles, sharing, and stakeholder output |

---

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript (strict)
- **Styling** — Tailwind CSS 4 + shadcn/ui (Nova)
- **Auth** — Auth.js v5 (database sessions)
- **ORM** — Drizzle ORM + PostgreSQL
- **AI** — Anthropic SDK (Claude Sonnet)
- **Queue** — BullMQ + Upstash Redis
- **Email** — Resend + React Email
- **Animation** — Framer Motion
- **Canvas** — React Flow (@xyflow/react)
- **Editor** — Tiptap
- **Deployment** — Vercel

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:migrate

# Start the dev server
pnpm dev
```

### Required environment variables

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
```

---

## Project Structure

```
claude/
├── src/
│   ├── app/
│   │   ├── (auth)/                          # Login, signup, onboarding
│   │   ├── (app)/[workspaceId]/[projectId]/ # Protected phase routes
│   │   ├── api/                             # Auth + webhook endpoints
│   │   └── share/                           # Public stakeholder views
│   ├── actions/                             # Server Actions (one per domain)
│   ├── components/                          # UI + phase-specific components
│   ├── lib/                                 # DB, auth, AI, integrations
│   ├── hooks/                               # Client-side React hooks
│   ├── types/                               # Shared TypeScript types
│   └── styles/                              # Tailwind tokens + map node CSS
```

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Biome lint check
pnpm lint:fix         # Auto-fix lint issues
pnpm typecheck        # TypeScript check
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Open Drizzle Studio
pnpm test             # Run Vitest
```
