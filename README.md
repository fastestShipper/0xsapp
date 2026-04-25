# Control A

WhatsApp-style AI workspace where every contact is a specialized agent. Multi-tenant, per-user memory, single LLM backend (Hermes USA).

## Stack

- Next.js 15 + React 19 + Tailwind + Framer Motion
- Supabase (auth, Postgres, RLS for per-user isolation)
- Hermes USA (LLM backend, multi-profile) — Anthropic API as fallback

## Architecture

Every message follows the same path:
1. Frontend sends `{ agent_id, message }` to `/api/chat`
2. Server validates Supabase JWT, extracts `user_id`
3. `buildUserContext(user_id, agent_id)` pulls business profile, preferences, roster, recent messages, recent artifacts from Postgres
4. `renderContextBlock(ctx)` formats it as a block injected into the agent's system prompt
5. `callAgent()` dispatches to Hermes USA (or Anthropic) with the system prompt + context + message
6. Response is persisted (message + optional artifact), returned to UI

**Why this scales without rework:**
- Single source of truth (Postgres) for all per-user state
- Agents are stateless — they don't remember anything; the context is rebuilt every call
- New agents inherit the same context block automatically
- Multi-tenant isolation enforced at the DB level via RLS

## Setup

```bash
cp .env.example .env.local
# Fill in Supabase credentials
# Run migrations: supabase db push
bun install
bun run dev
```

Demo mode (no Supabase needed): `NEXT_PUBLIC_DEMO_MODE=true`.

## Tables

- `users` — auth-linked profile
- `user_context` — KV per user (business, preferences, learned facts)
- `agents` — global catalogue + user-created
- `rosters` — which agents each user has hired
- `messages` — conversation history per user × agent
- `artifacts` — code, previews, images, videos, docs, dashboards

All tables enforce `auth.uid() = user_id` via RLS.
