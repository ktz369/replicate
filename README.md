# OxAgent

> ⚠️ **Nama ini placeholder.** Ganti sekali di [`src/brand.ts`](src/brand.ts)
> (`name`, `id`, `tagline`, `author`) dan seluruh agen re-branding.

Agen personal terinspirasi arsitektur [hermes-agent](https://github.com/NousResearch/hermes-agent),
dijalankan di atas harness **pi coding-agent** (SDK + extensions + skills) — bukan fork Python.

## Pemetaan konsep Hermes → Pi

| Kemampuan Hermes | Implementasi kita di Pi | Status |
|---|---|---|
| SOUL.md identity + 3-tier prompt cache | `soul/SOUL.md` + `src/system-prompt.ts` via `DefaultResourceLoader.systemPromptOverride` | ✅ scaffold |
| Agent-curated memory (MEMORY.md) | extension `extensions/memory.ts`: tool `memory_save` / `memory_search` | ✅ scaffold |
| Skills (agentskills.io) | native pi skills (`~/.pi/agent/skills`, `.pi/skills`) — standar yang sama dengan Hermes | ✅ gratis dari Pi |
| Multi-provider model | `ModelRuntime` pi (auth.json/models.json) | ✅ gratis dari Pi |
| Gateway Telegram/Discord/… | `gateway/gateway.ts` (Telegram long-poll, SDK embed) | 🚧 skeleton |
| Cron/scheduled automations | bb automations atau node-cron di gateway | ⬜ Slice 3 |
| Subagent delegation | spawn `createAgentSession()` nested via SDK | ⬜ Slice 3 |
| FTS5 session search | pi session JSONL + grep/FTS index | ⬜ Slice 4 |
| TUI penuh (slash commands dll.) | `InteractiveMode` SDK + custom theme | ⬜ Slice 2 |

## Menjalankan (Slice 0)

```bash
cd oxagent
npm install
export ANTHROPIC_API_KEY=sk-...     # atau provider lain via ~/.pi/agent/auth.json
npm run cli                          # chat di terminal
TG_BOT_TOKEN=123:abc npm run gateway # bridge Telegram
```

## Roadmap

- **Slice 0** — branding layer + memory loop + CLI PoC *(repo ini)*
- **Slice 1** — verifikasi end-to-end CLI, hardening prompt, unit test system-prompt
- **Slice 2** — full TUI (`InteractiveMode`) + tema sendiri + slash commands `/model` dsb.
- **Slice 3** — gateway production-grade (Telegram stabil, Discord adapter, cron delivery)
- **Slice 4** — session search + auto-skill creation (loop belajar penuh ala Hermes)

## Lisensi

Pilih lisensi sendiri (Hermes: MIT — kode kita orisinal, tidak ada copy kode upstream).
