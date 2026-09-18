# Historical (Hermes era): checkpoint example below is from the Hermes-era MAJESTA OS
# build (Windows host, Historical (Hermes era) tooling: `session_search`; Windows host path `D:/hermes-agent`). Kept as a PATTERN example;
# re-verify at adoption. On the pi/bb stack the equivalents are: T1 recall via Mnemosyne
# (`mnemosyne_recall`, with `mnemosyne_propose` + operator approval via
# `mnemosyne_approve.py` for durable captures) and pi session JSONL transcripts under
# `~/.pi/agent/sessions/` — NOT the paths or tool names shown here.

# MAJESTA OS Checkpoint — Concrete Memory Migration Example

This is a real-world example of how development checkpoint state maps across T0–T4 memory tiers for a project where code lives on a different machine than the agent.

## Project: MAJESTA OS

- Code location: `D:/hermes-agent` (Windows machine; Historical (Hermes era) — current repo lives in the MAJESTA bb worktrees)
- Agent environment: Linux container (`/app`)
- Last verified phase: Phase 8 (AP aging/reporting parity + schema-v2 migration regression)
- Commit: `e136c8d76`
- Branch: `codex-kledo-accounting-os`
- Tool count: 40
- Test baseline: 12 passed

## Correct Tier Placement

### T0 (hot memory) — pointer only
```
MAJESTA OS dev checkpoint: Phase 8 done, commit e136c8d76, branch codex-kledo-accounting-os, repo D:/hermes-agent (Windows). Skill: accounting-system-development.  # Historical (Hermes era) values — re-verify at adoption
```
~150 chars. Just enough for the agent to know what to load next.

### T1 (session search) — full history
Sessions `20260515_042348`, `20260515_042936` contain the full development journey from Phase 7 through Phase 8 (Historical (Hermes era) session IDs — re-verify at adoption; do not treat as live pi session JSONL names). Use T1 recall (`mnemosyne_recall`) when detailed context is needed.

### T2 (skills) — procedure + references
`accounting-system-development` skill carries:
- `references/majesta-phase7-continuation.md` — Phase 7 verified state, verification commands
- `references/majesta-phase8-reporting-migration.md` — Phase 8 scope, pitfalls, test expectations
- `references/cross-environment-checkpoint-reconciliation.md` — how to resume from a different machine

### T3 (docs) — architecture + plans
- `MAJESTA OS/INDEX.md` (on Windows) — navigation + restart guidance
- `MAJESTA OS/08-SESSION-RESUME.md` (on Windows) — full verified state
- `MAJESTA OS/10-NEXT-SESSION-BRIEF.md` (on Windows) — short handoff
- `docs/architecture/memory/majesta-boundary.md` (on Linux HCR) — truth boundary rules
- `majesta-boundary-contract-hardening-implementation-plan.md` (on Linux) — draft plan

### T4 (runtime truth)
HCR `majesta_connector` adapter exists but uses a simplified mirror schema. It is NOT the MAJESTA OS canonical DB. This is a known gap.

## Anti-Pattern Example

Wrong approach: dumping full checkpoint text into T0:
```
MAJESTA OS: Phase 8 AP aging/reporting parity + schema-v2 migration regression coverage is complete and verified. 
Report pack runs against current standalone schema. HTML includes AP Aging section. 
Summary includes ap_outstanding. Month-end close surfaces AP aging, journal reversal count, 
locked-period state. Schema-v2 migration covers pre-v2 databases. Focused test:
test_majesta_os_phase8_reporting_migration.py. Expected: 3 passed. Combined suite: 12 passed.
Tool alignment: 40 40 True. Commit e136c8d76. Branch codex-kledo-accounting-os...
[continues for 500 more chars]
```
This crowds T0 with state that belongs in T2/T3 and will become stale.

## Migration Trigger

When operator asks "inspect progress and migrate to memory system":
1. Verify current state via T1 recall (`mnemosyne_recall`; Historical (Hermes era): `session_search`) + skill references
2. Identify which tier is missing what
3. Offer options ranked by blast radius (pointer-only → connector alignment → full implementation)
4. Never write accounting facts or operational state into T0
