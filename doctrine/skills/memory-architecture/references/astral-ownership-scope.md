# ASTRAL Memory Architecture Ownership

Boundary contract for ASTRAL's memory architecture responsibility. Defines what ASTR owns, what Luce directs, and what escalates to Core Group.

Note: thread IDs below (thread 856 = ASTRAL's lane, thread 1 = Core Group) are Historical (Hermes era) T4 anchors — re-verify at adoption and re-anchor to the current bb thread IDs before using them for routing.

Effective: 2026-06-04 (handoff from Luce). Handoff doc: `docs/handoff/2026-06-04-memory-architecture-handoff-to-astral.md`.

## ASTRAL Owns (executes autonomously)

| Domain | Action | Authority |
|--------|--------|-----------|
| T0 hygiene | audit, delete, compress, migrate | ASTRAL |
| T2 skill structure | progressive disclosure, per-agent budget enforcement, new non-trinity skills | ASTRAL |
| T3 doc lifecycle | INDEX.md maintenance, archive stale docs, doc templates | ASTRAL |
| T1 recall discipline | operator habit guidance, query pattern examples | ASTRAL |
| T4 observability | dashboard setup, conflict logging | ASTRAL (read-only on T4 itself) |

## ASTRAL Asks Luce (escalates for review/direction)

- merging or splitting a trinity-* skill (e.g., combining 2 of the 7)
- changing the T0–T4 boundary definitions
- changing the source-of-truth order
- any T4 integrity question (read/write policy change)
- major skill name changes that affect multiple agent configs

## ASTRAL Escalates to Core Group (operator-level)

- scope changes that touch other agents' T0 or TOML configs
- cross-agent memory migration
- operator-visible changes to channel prompts or system prompts
- any irreversible or externally consequential memory decision

## Coordination Protocol

- ASTRAL works in **thread 856**
- ASTRAL asks questions in thread 856
- Luce responds in thread 856 or via Core Group (thread 1)
- Major scope changes → Core Group (thread 1)
- No operator involvement for routine execution
- Routine handoffs: ASTRAL posts status in thread 856, Luce acknowledges

## Decision Log (lives in T4, summarized in T3)

| Date | Decision | Source |
|------|----------|--------|
| 2026-06-04 | ASTRAL takes ownership of T0–T4 execution; Luce remains director | handoff doc |
| 2026-06-04 | T0 emergency cleanup Phase 1 complete (96% → 34%) | this skill's audit trail |
| 2026-06-04 | Keep 7 trinity-* skills as-is (consolidation risk > reward) | ASTRAL audit, Luce approved |
| 2026-06-04 | Created `memory-architecture` skill to capture T0–T4 doctrine | ASTRAL execute, Luce direct |

## Pitfalls (lessons learned)

- **Skill name collision is a silent dispatch killer.** Renamed `trinity-mode-operating-anchor` reference inside `trinity-mode-default` to `trinity-operating-anchor-pattern.md` to fix `Ambiguous skill name` errors.
- **Don't add new trinity-* skills** without auditing the canonical 7. Bundle stays at 7.
- **Don't conflate "per-agent skill budget" with "total trinity skills".** The 7-skill bundle is the trinity baseline; agents add role-specific overlays on top.
- **Don't migrate memory to T3 if the content is procedure** — T2 (skills) is the right home for SOPs.
