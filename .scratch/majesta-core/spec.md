# Spec — MAJESTA Core: messaging-first personal agent on the pi harness

Status: ready-for-agent
Source: /grill-me session (design tree fully settled with the owner)

## Problem Statement

The owner uses Hermes-style personal agents: an agent that lives in their
conversations, remembers across sessions, and acts on their machine. Hermes
itself is a large Python codebase whose architecture they can't shape, and its
hand-rolled surfaces (sessions, TUI, skills, provider runtime) reimplement
things the pi coding-agent harness already does better. They want *their own*
agent with the same lived experience, built natively on pi.

## Solution

MAJESTA: a personal agent on the pi harness that is reachable primarily
through messaging platforms (Telegram first), runs 24/7 on the owner's VPS,
shares one identity and one memory across all chats, gates risky actions
behind inline approve/deny taps, routes tasks to the right model per intent,
and measurably improves its own skills and knowledge over time.

Governing principle (written, first line of the project): **never rebuild what
pi ships** (sessions, TUI, skills, provider runtime, core tools) — extend via
extensions/skills/plugins; custom code only where pi has no answer. Every
future design dispute is settled by this rule.

## User Stories

1. As the owner, I want to message MAJESTA from Telegram, so that my agent is reachable from my phone anywhere.
2. As the owner, I want a second door via WhatsApp, so that I use whichever app is in my hand.
3. As the owner, I want Google Chat access too, so that work conversations live where work happens.
4. As the owner, I want iMessage eventually, so that even Apple-only contacts contexts are covered (blocked until dedicated Mac hardware exists).
5. As the owner, I want one shared identity across all platforms, so that MAJESTA is one being, not four strangers.
6. As the owner, I want per-chat conversation sessions, so that context doesn't bleed between chats.
7. As the owner, I want conversations to survive gateway restarts, so that a deploy doesn't wipe what we were discussing.
8. As the owner, I want MAJESTA to remember facts I tell it autonomously, so that I never repeat myself.
9. As the owner, I want to ask about last week's work from my phone and get a correct remembered answer, so that memory is proven real, not claimed.
10. As the owner, I want MAJESTA to execute real tasks (files, shell) in a dedicated workspace on my VPS, so that "do X for me" actually happens.
11. As the owner, I want read-only actions to run without asking, so that the agent stays fluid.
12. As the owner, I want writes/shell-exec/irreversible actions gated behind [Approve]/[Deny] inline buttons, so that destructive power costs me exactly one thumb-tap.
13. As the owner, I want only my sender identities allowed, so that nobody else can drive my machine.
14. As the owner, I want messages routed to the right model per intent, so that quick chats are cheap and hard tasks get the reasoning model.
15. As the owner, I want automatic failover to the alternate provider, so that one provider's outage doesn't silence my agent.
16. As the owner, I want routing rules in a plain config file I edit myself, so that I tune behavior without code changes.
17. As the owner, I want skill creation and knowledge promotion proposed to me in chat before applying, so that behavior changes are always my call.
18. As the owner, I want MEMORY.md appends to stay autonomous, so that learning isn't a confirmation dance.
19. As the owner, I want the agent rooted in a workspace directory, so that mistakes have a bounded blast radius.
20. As the owner, I want an `npm run e2e` check that proves the whole pipeline against the real provider, so that "verified" means evidence, not vibes.
21. As the owner, I want unit tests over the system prompt, so that prompt regressions fail loudly.
22. As the owner, I want the repo self-contained after clone, so that fresh machines behave like mine.
23. As the owner, I want durable session-memory capture (Mnemosyne) that survives reboots, so that lessons accumulate instead of evaporating.
24. As the owner, I want systemd deployment with a container-friendly process, so that hosting is boring and portable.
25. As the owner, I want an Electron desktop client at the end, so that the same brain gets a rich local view.

## Implementation Decisions

- Product definition: replicate what Hermes *is* (experience), not its feature checklist; architecture is pi-native.
- Platform order: Telegram → WhatsApp → Google Chat → iMessage. iMessage is recorded as blocked-on-hardware (needs an always-on Mac bridge); no build starts until hardware exists.
- Runtime topology: single gateway process on the owner's VPS (assumption on record: modern Linux, modest resources); terminal CLI remains the dev/debug surface.
- Deployment: systemd unit (`Restart=always`); the process takes env-config only so an optional Dockerfile works; manual git-pull deploys; no auto-update.
- Session topology: per-chat sessions keyed by chat id, shared global identity/memory. Known scaffold gap to fix: gateway chats currently use in-memory sessions.
- Security model: tiered approvals — reads free; writes/exec/irreversible require inline-button approval in chat. Sender allowlist per platform.
- Self-improvement split: memory appends autonomous; skill creation and knowledge-bundle promotion are proposed-in-chat and approval-gated.
- Model posture: per-intent classification picks the model before session creation; failover to the alternate provider on failure; mapping rules live in a plain config file; no routing subsystem (pi-native rule).
- Workspace rooting: all sessions run inside a dedicated VPS workspace directory set by config.
- WhatsApp transport: Baileys (lightweight, no headless browser), chosen for unknown-modest VPS resources; adapter-internal detail, swappable.
- Test runner: node:test via tsx — no framework dependency.
- Repo hygiene: `.pi/skills/` committed; Mnemosyne moved into a repo-level, gitignored venv.

## Testing Decisions

Good tests assert external behavior through few, high seams — not implementation details:

1. Pure-function seam over temp-dir fixtures: prompt builder and memory logic driven by fixture files (SOUL.md present/absent, oversized MEMORY.md). Existing seam; zero new surface.
2. Gateway adapter contract (new, highest point): one platform-adapter shape (normalized incoming message; text/button output). The core loop is tested against a fake adapter — never a network API. The extraction happens inside the WhatsApp ticket so the slice stays demoable.
3. Live E2E: scripted scenarios driving real entrypoints against the real provider, asserting exit codes, streamed output, and memory round-trips; plus one documented manual interactive smoke session.

No source-reading tests, no snapshot-of-current-data tests; behavior contracts only.

## Out of Scope

- Kanban fleet, profile multiplexing, dashboard web UI, Windows support (cut by owner decision).
- Any platform beyond the four listed; any auto-update scheme; multi-user/onboarding polish; OSS packaging (setup wizard, docs site) until the personal bar is met.
- Reach-back into home machines (explicit future capability — the VPS is the agent's world at launch).
- Electron desktop until all three unblocked platforms land.
- iMessage until a dedicated Mac exists.

## Further Notes

- Definition of done (project level): ① phone query about last week's work returns a correct remembered answer · ② real task executed safely in the VPS workspace from chat · ③ demonstrable self-improvement of skills/knowledge over time.
- Tickets: `.scratch/majesta-core/issues/NN-<slug>.md`, mirrored 1:1 to bb Tasks (markdown stays source of truth).
