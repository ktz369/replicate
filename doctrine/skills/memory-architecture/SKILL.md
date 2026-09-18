---
name: memory-architecture
description: Use when working on Trinity memory layers (T0–T4) — placement decisions, T0 hygiene, skill consolidation, doc lifecycle, or memory migration. Owned by ASTRAL. Captures T0–T4 doctrine and migration rules in one place.
version: 1.0.0
author: ASTRAL
license: MIT
# Historical (Hermes era): original skills used a `metadata.hermes` block.
# Renamed to provenance — same fields, no runtime meaning on the pi stack.
metadata:
  provenance:
    original_block: metadata.hermes  # Historical (Hermes era)
    tags: [memory, trinity, t0, t1, t2, t3, t4, doctrine, ownership]
    related_skills: [trinity-mode-default, trinity-mode-operating-anchor, trinity-memory-placement, skill-lifecycle-ops]
    owner: ASTRAL
    parent_skill: trinity-mode-default
---

# Memory Architecture (T0–T4)

## Overview

Single source of truth for **how information moves between the five Trinity memory layers**, who owns what, and how to keep the layers from leaking into each other.

Owner: **ASTRAL**. Director: **Luce**. (Historical (Hermes era) lane identifiers: ASTRAL = thread 856, Core Group = thread 1 — re-verify at adoption; on the pi/bb stack these are bb thread IDs.) The handoff that transferred ownership is archived at `docs/handoff/2026-06-04-memory-architecture-handoff-to-astral.md` (Historical (Hermes era) provenance path — verify it exists in the adopted repo before citing).

## When to Use

- deciding where a fact should live (T0 vs T1 vs T2 vs T3 vs T4)
- auditing or compressing T0
- migrating procedure out of T0 into skills
- reviewing stale docs in T3
- resolving source-of-truth conflicts
- explaining the five-layer model to a new agent

## Core Doctrine

**Trinity-Lite is the control plane. T4 is runtime truth. T0 stays tiny.**

| Layer | Purpose | Limit | Owner | Anti-pattern |
|-------|---------|-------|-------|--------------|
| **T0** hot memory | compact directives, stable prefs, short pointers | ~2,200 chars (agent) + ~1,375 chars (user) | self-managed | dumping checkpoints, task progress, doctrine |
| **T1** session recall | prior discussion, handoff reconstruction | unbounded (SQLite FTS5) | agent-managed via Mnemosyne (Historical (Hermes era): auto) | treating recall as authority |
| **T2** skills/procedure | SOPs, playbooks, stable doctrine | unbounded (skill files) | skill author | putting reusable procedure in T0 or T3 |
| **T3** docs/notes | architecture, design rationale, handoffs | unbounded (filesystem) | doc author | letting doc prose override T4 |
| **T4** operational state | task/workflow state, attempts, events, results | unbounded (runtime) | runtime | sacrificing T4 for convenience |

## Quick Placement Matrix

Where should this fact live?

- user preference or stable directive → **T0**
- prior conversation or handoff evidence → **T1**
- reusable SOP or doctrine → **T2**
- architecture explanation or report → **T3**
- current task/workflow/result state → **T4**
- accounting fact → **MAJESTA** (out of scope here)

Which source should answer the question?

- "What owns this task right now?" → T4
- "What does this schema mean?" → versioned contract
- "How do we normally operate this?" → T2
- "Why was this designed this way?" → T3, maybe supported by T1
- "What did we discuss last session?" → T1
- "Where does this short directive live permanently?" → T0

## Source-of-Truth Order

When sources disagree, resolve in this order:

1. T4 operational state / projections
2. Versioned contracts
3. T2 skills / references
4. T3 docs / notes
5. T1 session recall
6. T0 hot memory

**Execution rule:** if T4 and a doc disagree, T4 wins for execution. If memory and runtime disagree, runtime wins.

## Memory Migration Rule

When T0 starts getting crowded, do this in order:

1. move reusable procedure into a skill or reference doc (T2)
2. keep only a compact pointer in T0
3. keep long explanation in T3
4. keep history in T1
5. keep live execution truth in T4

**Do not solve memory pressure by stuffing more into T0.** The upgrade path is migration, not accumulation.

## T0 Compression Techniques

Four techniques, in order of payoff:

1. **Deduplication** — find and merge entries that encode the same fact in different phrasings. Cheapest, safest, and often the highest-yield step because memory grows from "I added it under one name" + "I added it again under a slightly different name" over time. Example observed 2026-06-07: an entry under "Web UI (Hermes Hub): FastAPI+Vue3, Apple+Editorial…" coexisted with another under "Hermes Hub (web app): FastAPI + Vue3/SPA, Apple+Editorial…". They were the same fact with different capitalization and punctuation. Merging freed ~200 chars. Run `mnemosyne_recall` to list entries (Historical (Hermes era): `memory()`), then for each pair ask "do these say the same thing?" — if yes, keep the shorter one and remove the longer. Frees 100-300 chars per duplicate with zero behavior change.
2. **Pointer pattern** — T0 stores references, not content. Full content lives in T2/T3. Highest impact after deduplication.
3. **Terse encoding** — replace prose with key-value pairs (`ENV: ...`, `LANG: ...`).
4. **T0 split (advanced)** — T0-core (always loaded) + T0-contextual (loaded by workstream). Needs routing logic. Avoid for now.

## ASTRAL's Ownership Scope

ASTRAL owns:

- T0 hygiene (cleanup, compression, migration)
- T2 skill structure (progressive disclosure, per-agent budget, consolidation)
- T3 doc lifecycle (INDEX.md, archive, quarterly review)
- T1 recall discipline (operator habit guidance)
- T4 observability — **never sacrifice T4 = authoritative principle**

ASTRAL escalates to Luce for:

- skill consolidation decisions (e.g., merging trinity-* skills)
- major architecture changes to T0–T4 boundaries
- any T4 integrity question

ASTRAL escalates to Core Group (thread 1) for:

- scope changes that affect other agents' T0/tomls
- cross-agent memory migration
- operator-visible changes to channel prompts

## Context Compaction — T4 Integrity Risk (CRITICAL)

When a session's context window is compacted to stay under the context window limit (on the pi stack: treat any compaction/summary event as the trigger; Historical (Hermes era): the Hermes gateway triggered compaction around 100+ messages). The compacted window **retains T0 memory** (injected into system prompt) but **discards earlier turn history** — including any T4 verification checks that were performed.

**This is a structural T4 integrity risk.** After compaction:
- T0 memory entries remain (they're auto-injected)
- Prior T4 checks (runtime thread-listing reads, config audit results; Historical (Hermes era): `sessions.json` reads) are gone
- The agent has **no mechanism to distinguish stale T0 from freshly-verified T0**

**Doctrine violation cascade (real incident 2026-06-04):**
1. Long session compacts → T4 verification history deleted
2. Agent trusts T0 memory entry without re-verifying
3. Agent misroutes cross-thread message by inference
4. Operator correction is misinterpreted as canonical declaration
5. Agent updates T0 with wrong value → cascade failure

**Mitigation (deployed 2026-06-04):** THREAD-ROUTING HARD RULE in the channel-prompt surface at three touchpoints (DM, Core Group, ASTRAL). Before any cross-thread send, verify the target thread against runtime truth — bb thread listings and pi session JSONL paths (Historical (Hermes era): `sessions.json` or `config.yaml channel_prompts`). Routing by T0 memory alone is PROHIBITED.

**Post-compaction protocol:** after compaction events, re-verify all T0 entries that reference T4 state (thread IDs, agent mappings, runtime facts). The T0 entry `AST=856 (verified T4 2026-06-04, sessions.json). DO NOT change without T4 verification.` carries its own verification tier label — use it as the model for all T4-sensitive entries. (The `AST=856` value itself is Historical (Hermes era) — re-verify at adoption; on the pi/bb stack, re-anchor to the current bb thread ID before reuse.)

Full postmortem: `docs/architecture/trinity/doctrine-violation-2026-06-04.md`
Deployment pattern: `references/thread-routing-hard-rule-pattern.md`

## T0 Write Instability at High Capacity (CRITICAL)

Historical (Hermes era) incident record — the mechanism below was the Hermes `memory` tool; on the pi stack the analogous risk is any memory-write path that returns success without read-back verification. The doctrine (never write above 90%, re-read after writes) carries over unchanged.

When T0 is near its hard limit (~97%, 2,144/2,200 chars), the memory tool becomes unstable (Historical (Hermes era): the `memory` tool). **Writes can silently corrupt other entries** — an add or replace may revert a previously-correct entry to a stale value.

**Observed behavior (2026-06-04, Historical (Hermes era) telemetry):** while at 97%, a memory add added a new entry but simultaneously reverted `AST=856` to `AST=4` — an entry that had been corrected in a prior session. The corruption was silent; the tool returned success with no error.

**Rule:** never write to T0 above 90%. Above 90%, compress or migrate before any write. If a write is unavoidable at high capacity, re-read all T0 entries immediately after the write to detect silent corruption.

**Detection pattern:** after any memory write (Historical (Hermes era): `memory()` call; current stack: a Mnemosyne proposal/approval), check the returned entry list for unexpected changes — especially thread IDs, agent mappings, and other T4-sensitive facts.

## Context Window Monitoring (CRITICAL — operator doctrine 2026-06-05)

**Baseline:** context window = 128K (131,072 tokens). Monitoring threshold = **40% = 52,429 tokens**.

This applies to **ALL threads + operator DM** — not just critical agents. Every session (pi session JSONL under `~/.pi/agent/sessions/`) must be monitored.

### Risk Tiers

| Tier | % Range | Token Range | Label | Action |
|------|---------|-------------|-------|--------|
| 40-55% | 52,429–72,090 | WARNING | Draft handoff brief |
| 55-70% | 72,090–91,750 | CRITICAL | Handoff + reset ASAP |
| >70% | >91,750 | COLLAPSED | Reset immediately |

### Detection Pattern

Watchdog job (mini-cron with a crontab file under `scripts/cutover`, or cron bb) every 30 minutes scans pi session transcripts, flags all sessions over the token threshold, alerts to Core Group. Reference implementation: `scripts/context-window-monitor.py` in this skill (token counts estimated from transcript size — pi JSONL has no token-count field; Historical (Hermes era): the cron read `sessions.json` `last_prompt_tokens > 52429`).

Alert format: `session_key | token_count | percentage | risk_level | action_needed`

### Handoff-Before-Reset Pattern (mandatory)

When a session exceeds 40%:
1. Capture task state via T1 recall (`mnemosyne_recall`; Historical (Hermes era): `session_search`)
2. Create handoff brief at `docs/handoff/YYYY-MM-DD-<thread-id>-context-window-handoff.md`
   - TL;DR + last task state + pending items + next session anchor instructions
3. **Verify handoff file exists** on disk (`read_file`) before reset
4. Reset session
5. **Exception:** Core Group (thread 1) requires explicit approval before reset. All other threads auto-reset after handoff verified.

### Agent Saturation (pre-existing — kept for reference)

Above ~70K prompt tokens, agents stop producing output while still accepting inbound messages. This is **not a crash, not a suspension, not an error** — it's context exhaustion.

**Symptoms:**
- pi session JSONL size implies estimated tokens > 70K (Historical (Hermes era): `sessions.json` showed `last_prompt_tokens` > 70K)
- Gateway log shows "Flushing text batch" for the thread (messages IN)
- No response text in the log (nothing OUT)
- Session NOT suspended — agent still receives, just can't produce
- Operator sees "agent not responding"

**Fix:** reset the session. The agent cannot self-diagnose saturation — this must be detected externally (by the operator, or a watchdog cron). On the pi/bb stack, session reset is operator-owned (Historical (Hermes era): reset by Luce, operator, or watchdog cron).

For proactive detection (before saturation), use the 40% threshold and risk tiers above — the saturation cutoff at 70K+ is the late-stage emergency signal, not the primary monitoring target.

## Cross-Agent T0 Isolation (T4-Verified 2026-06-04)

**T0 memory is per-agent isolated, NOT shared across agent instances.** This was verified live in a dual-agent session (Historical (Hermes era): verification performed on the Hermes stack — re-verify at adoption if per-agent isolation boundaries matter for a pi-stack decision):

- ASTRAL compressed its T0 to 63% (1,395/2,200) via the memory tool in its own lane (Historical (Hermes era): thread 856)
- The other agent's T0 remained at 97% (2,144/2,200) — no propagation occurred
- The memory tool writes to the calling agent's own prompt context, not a shared pool
- A shared `MEMORY.md` on filesystem was not found at the expected path — storage is per-agent prompt injection, not a shared file (Historical (Hermes era) observation; on the pi stack, T0-equivalent content is Mnemosyne working memory + injected context)

**Implications:**

- When ASTRAL compresses T0, other agents do NOT see the change. Each agent manages its own T0.
- Cross-agent T0 coordination requires explicit messaging (Historical (Hermes era): e.g. Luce asked ASTRAL in thread 856: "is my T0 safe to compress?")
- T0 capacity warnings from one agent are invisible to others — no broadcast mechanism exists
- The memory tool's `add/replace/remove` actions are scoped to the calling agent's instance only (Historical (Hermes era): `memory` tool; current stack: Mnemosyne proposals are operator-approved via `mnemosyne_approve.py`, which changes the sharing semantics — verify at adoption)

**Blind spots (still true):**

- Agents have no awareness of their own T0 capacity except through the memory tool's response (Historical (Hermes era): `memory` tool response)
- No alert mechanism exists for "T0 > 80% full"
- No cross-agent T0 visibility — each agent operates blind to others' capacity

**T4 gap:** T0 capacity is runtime state that should be visible at T4 level with cross-agent awareness. Currently: per-agent isolated, no broadcast, no alerting. This is on ASTRAL's backlog.

## T1 Storage Reality (Session Recall)

T1 is **shared**, not per-agent. (Historical (Hermes era): single SQLite FTS5 store `state.db` + per-session JSON exports; ALL agents queried the same message store via `session_search` with no per-agent filter.) On the pi/bb stack, session recall is **Mnemosyne** (local SQLite, working + episodic banks; `mnemosyne_recall` / `mnemosyne_propose` / `mnemosyne_approve.py`) plus raw pi session JSONL transcripts under `~/.pi/agent/sessions/`.

**Measured T1 size (2026-06-07, Historical (Hermes era) telemetry):** `state.db` 667 MB + 1,260 session JSONs (323 MB) = **~991 MB** total. Growing unboundedly (no TTL or rotation exists). Re-measure Mnemosyne + pi sessions at adoption.

**Common confusion:** the user may say "T1 is bloated" meaning T0 (which is fixed-limit and addressed by `t0-emergency-cleanup-procedure.md`). T0 bloat and T1 bloat have different symptoms, different fixes, and different urgency tiers. When the user reports "T1 bloated," confirm which one they mean before acting.

For detection, current T1 size, and what lives in session recall storage, see `references/t1-storage-reality.md`.

## Anti-Patterns

Avoid:

- using docs as a task queue
- treating session recall as live truth
- storing runtime state in T0
- treating indexed knowledge artifacts as canonical execution state
- inferring accounting truth from Control Room summaries
- letting long handoffs replace the operational store
- promoting historical text into authority without review
- adding new `trinity-*` skills — keep the bundle at 7
- growing an agent's skill count past its budget without audit
- **Stopping mid-execution to ask the operator.** When ASTRAL is delegated a multi-phase task and the operator says "execute" / "jangan nunggu" / "delegasiin", run all phases end-to-end. Routine sub-tasks (skill creation, doc writes, cron setup, archive moves) are within scope. Escalate only on true scope changes (cross-agent T0 changes, agent TOML modifications, irreversible external actions). See `trinity-mode-default/references/delegation-execution-discipline.md` for the full pattern.
- **Broad date globs in `docs/handoff/` that grab the canonical anchor.** `2026-06-03-*.md` overlaps the Canonical Trinity Anchor (`2026-06-03-trinity-skill-activation-trigger.md`) with superseded closeouts that share the same date prefix. This happened on 2026-06-07 and was caught same-session; `.bak` recovery was available only because moves went to `_archive/` instead of `rm`. Always: (1) list files before bulk mv, (2) explicitly exclude the canonical anchor file, (3) verify it still exists at top level after the move.

## Verification Checklist

- [ ] Question type identified (T0/T1/T2/T3/T4 placement)
- [ ] Authoritative layer selected per source-of-truth order
- [ ] Pointer pattern applied if T0 entry >50 chars
- [ ] Reusable procedure migrated to T2 instead of bloating T0/T3
- [ ] T4 was consulted for any current-state claim
- [ ] No memory entry duplicates a T2 skill trigger
- [ ] No new trinity-* skill added (bundle stays at 7)

## References

- `references/t0-emergency-cleanup-procedure.md` — step-by-step T0 audit and cleanup (Phase 1 playbook)
- `references/memory-hygiene-sop.md` — ongoing hygiene cadence and monitoring
- `references/astral-ownership-scope.md` — ASTRAL vs Luce vs Core Group boundary contract
- `references/skill-collision-detection.md` — silent dispatch killer detection pattern
- `references/t0-watchdog-pattern.md` — recurring T0 size check as a silent watchdog (mini-cron / cron bb on the current stack; Historical (Hermes era): `hermes cron` + `no_agent=True`)
- `references/t0-inspection-and-export.md` — inspect physical T0 files (`USER.md`, `MEMORY.md`), decide whether to include `.lock` files, and export exact `.zip` archives via Python `zipfile` without relying on the `zip` CLI
- `references/t1-storage-reality.md` — what lives in T1, measured size, the per-agent-vs-shared misconception, and the open question of how to truncate session-recall storage safely (Historical (Hermes era): `state.db`)
- `references/external-memory-plugins.md` — external memory plugin catalog (holographic, honcho, mem0, etc.; Historical (Hermes era) evaluation — re-verify against pi extensions before acting on it), and when to use vs. internal T0-T4
- `references/majesta-checkpoint-migration-example.md` — concrete T0–T4 mapping example (mirrored from trinity-memory-placement)

- `scripts/context-window-monitor.py` — cron-friendly context window monitor with risk tiers (40% threshold)
- `scripts/detect-agent-saturation.py` — legacy saturation detector (65K+ threshold, still useful for late-stage alerting)

## Cross-Reference

- Parent doctrine: `trinity-mode-default`, `trinity-mode-operating-anchor`, `trinity-memory-placement`
- Handoff origin: `docs/handoff/2026-06-04-memory-architecture-handoff-to-astral.md`
- T3 source of truth: `docs/architecture/trinity-lite-memory-layer-guide.md`

---

## PACI-X Cutover Note (2026-09-05, ticket 04b)

This skill was ported from the Hermes chat-harness profile (Historical (Hermes era) origin). Harness-specific
references (Hermes gateway cron/kanban commands — Historical (Hermes era) — and Telegram delivery targets,
surface locks, Hermes context compaction) are **historical record** — the
current runtime is the pi coding-harness profile (`pi-paci-x`). Where a
procedure depends on a Hermes-only mechanism (Historical (Hermes era)), use its cutover equivalent
(mini-cron + scripts/cutover/*, bb tasks, direct Telegram via tg-notify.sh)
or stop and ask the operator before improvising.
