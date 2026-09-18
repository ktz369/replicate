# T1 Storage Reality

## T1 is NOT Per-Agent

The user may expect T1 to be per-agent (like T0), but it is not.

| Layer | Scope | Storage |
|-------|-------|---------|
| T0 (memory) | per-agent | system prompt injection, isolated by agent instance |
| T1 (recall) | shared | Mnemosyne SQLite (working + episodic banks) + pi session JSONL transcripts (Historical (Hermes era): single `state.db` + session JSON files) |
| T2 (skills) | shared | filesystem, all agents load from the same directory |
| T3 (docs) | shared | filesystem, all agents read the same files |
| T4 (runtime) | shared | bb/pi runtime state: bb task + thread state, pi session JSONL, environment state (Historical (Hermes era): sessions.json, gateway state, runtime process state) |

Historical (Hermes era): T1 recall was a single SQLite FTS5 database (`state.db`) plus per-session JSON exports, and ALL agents queried the same message store — `session_search` returned results from any thread. On the pi/bb stack, session recall is **Mnemosyne** (local SQLite; `mnemosyne_recall`) plus raw pi session JSONL transcripts under `~/.pi/agent/sessions/`. The shared-store lesson carries over: Mnemosyne is process-wide, not per-agent.

## Typical T1 Size (Measured 2026-06-07, Historical (Hermes era) telemetry)

```
state.db:       667 MB  (single SQLite FTS5 store)  # Historical (Hermes era)
Session JSONs:  1,260 files, 323 MB  (per-session exports for backup/restore)  # Historical (Hermes era)
Combined T1:    ~991 MB
```

This was the active T1 corpus on the Hermes stack — the full history of all Telegram messages across all threads since the system started (~May 2026). Every `session_search` query ran FTS5 against that 667 MB database (all Historical (Hermes era) telemetry). Re-measure at adoption: current stack equivalents are the Mnemosyne SQLite file(s) (row counts via `mnemosyne_stats`) plus `du -sh ~/.pi/agent/sessions/`.

## T1 Bloat vs T0 Confusion

When the user says "T1 is bloated," they may actually mean either:

1. **T0 is bloated** (the memory entries — limited to 2,200 chars, addressed by the emergency cleanup procedure)
2. **T1 is bloated** (the session database — unlimited, addressed by housekeeping, archiving old sessions, or truncation)

The two problems have different symptoms:

| T0 bloat | T1 bloat (real) |
|----------|-----------------|
| High chars in memory block header | Large DB file on disk |
| Writes silently corrupt at 97%+ | Recall queries slow down (Historical (Hermes era): `session_search` slowdown) |
| Fixed limit (2,200 chars) | Unbounded growth (years of data) |
| Fix: compress/migrate/delete entries | Fix: housekeeping, archive old sessions |

## Current State (2026-06-07)

T0 is the immediate concern (ASTRAL at 94-98%, approaching 97% write instability). T1 is a medium-term concern — 991MB is not critical today but will grow unboundedly. No T1 housekeeping procedure exists yet (T1 was assumed by user to be per-agent, making the shared 991MB finding surprising).

## What Lives in Session Recall Storage

Historical (Hermes era) mapping for `state.db`; the categories carry over to Mnemosyne + pi session JSONL:

- All message content (user + assistant turns) across all Telegram threads, DM channels, and cron sessions
- Full-text search index (Historical (Hermes era): FTS5 inside `state.db`, enabling `session_search`; current stack: Mnemosyne full-text recall via `mnemosyne_recall`)
- Session metadata, token counts, origin info
- Per-message routing details (thread_id, platform, timestamp)

There is currently no per-session TTL, no archival rotation, and no truncation mechanism. Sessions accumulate indefinitely.

## Detection

To check T1 size on any host:

```bash
# Historical (Hermes era) detection commands (paths under the old HERMES_HOME):
ls -lh /home/research/vava/hermes-data/.hermes/state.db  # Historical (Hermes era)
ls /home/research/vava/hermes-data/.hermes/sessions/*.json | wc -l  # Historical (Hermes era)
du -sh /home/research/vava/hermes-data/.hermes/sessions/  # Historical (Hermes era)

# Current-stack equivalents (pi/bb):
ls -lh ~/.pi/agent/*.db 2>/dev/null          # locate the Mnemosyne SQLite file
ls ~/.pi/agent/sessions/*/  | grep -c jsonl  # pi session JSONL count
du -sh ~/.pi/agent/sessions/
```

Historical (Hermes era) sizing trigger: if `state.db` exceeds 500MB or the session directory exceeds 250 JSON files, review whether old sessions can be archived. There is no guidance on how to truncate the recall store safely — this is an open operations question on both stacks.

## Cross-References

- T0-T4 model: `devops/memory-architecture/SKILL.md` (parent skill)
- T0 emergency cleanup: `references/t0-emergency-cleanup-procedure.md`
- T0 watchdog: `references/t0-watchdog-pattern.md`
- T1 bloat initial investigation: `docs/handoff/2026-06-06-t1-bloat-vs-real-performance-handoff.md` (Historical (Hermes era) provenance path — verify it exists in the adopted repo before citing)
