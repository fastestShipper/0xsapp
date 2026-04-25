# Control A — project context

WhatsApp-style multi-agent workspace at https://app.controla.group. Repo: `zpwpe/0xsapp` (private).

## Where the code lives

- **Local dev (Windows):** `Y:\work\controla-app`
- **USA VPS deploy (production):** `/root/controla-app` on `77.110.119.146`
- **Kali container clone (for editing inside the container):** `/root/workspace/controla-app`

The host `/root/kali-workspace/controla-app` and the container `/root/workspace/controla-app` are the same directory via volume mount.

## Stack

- Next.js 15 + React 19 + Tailwind + Framer Motion
- Hermes (loki instance at `/root/kali-workspace/configs/.hermes`) as the LLM backend, GPT-5.5 via OpenAI Codex OAuth
- Python HTTP bridge `hermes-bridge.service` on `127.0.0.1:7771` translating app HTTP calls → `hermes chat -q` with per-user session persistence (`/root/hermes-bridge/sessions.json`)
- ImageSmith on `127.0.0.1:8700` (uvicorn, muapi-backed) for the 12 image workflows Piter calls
- Postgres + multi-tenant via "User Context Injection" planned but not yet active — currently per-user isolation is done at the Hermes session level via `--resume` keyed by `user_id`

## Key files

- `src/app/api/chat/route.ts` — chat endpoint (forwards to bridge)
- `src/app/api/upload/route.ts` — file uploads → `/var/uploads/` + nginx `/uploads/`
- `src/app/api/transcribe/route.ts` — voice STT (xAI scribe_v2 primary, Gemini fallback)
- `src/lib/server/llm.ts` — bridge client
- `scripts/hermes-bridge.py` — the Python bridge running on USA
- `scripts/piter-soul.md` — Piter's system prompt (synced to `/root/kali-workspace/configs/.hermes/SOUL.md`)
- `scripts/nginx-app-controla.conf` — production nginx vhost
- `src/lib/workflows.ts` — 12 ImageSmith Quick Actions
- `src/lib/agents.ts` — agent + project + message types and the demo specialists
- `src/components/quick-actions.tsx` — workflow buttons popover on Piter's chat
- `src/components/chat-thread.tsx` — main chat (private DMs)
- `src/components/group-chat.tsx` — project group chat surface

## Services on USA VPS

- `controla-app.service` — Next.js production server on `:3088`
- `hermes-bridge.service` — Python HTTP wrapper for Hermes
- `kali-xrdp.service` — RDP (port 3389) into the Kali container

## Conventions

- **Spanish neutral** (no voseo). User-facing strings, prompts, comments aimed at users.
- **Branding:** blue Control A (sky-400 → blue-700), light gray background `hsl(218 16% 95%)`.
- **Concierge agent name:** Piter (with I, not Peter).
- **Specialists are silent** by default. Only Piter pushes proactive messages.

## Deployment dance

```bash
# from local
cd Y:/work/controla-app
tar -czf /tmp/u.tgz --exclude=node_modules --exclude=.next --exclude=.playwright-mcp src
scp /tmp/u.tgz root@77.110.119.146:/tmp/
ssh root@77.110.119.146 'cd /root/controla-app && tar -xzf /tmp/u.tgz && npm run build && systemctl restart controla-app'
```

## Auto-loaded memory

Per-project notes live at `~/.claude/projects/-root-workspace-controla-app/memory/` and are auto-loaded when `claude` is launched from `/root/workspace/controla-app` inside the Kali container.
