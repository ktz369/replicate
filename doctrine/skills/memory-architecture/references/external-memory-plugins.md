# External Memory Plugins vs Internal T0-T4

Historical (Hermes era) evaluation record. As of 2026-06-17, the Hermes harness shipped 8 memory provider plugins under `plugins/memory/` — all opt-in; the default was built-in only (MEMORY.md + USER.md = T0). On the pi/bb stack the built-in equivalent is **Mnemosyne** (local SQLite working + episodic banks with operator-approved promotion). Re-evaluate any plugin against the pi extension ecosystem before acting on this catalog.

## Plugin Catalog

| Plugin | Type | Maturity | Description |
|--------|------|----------|-------------|
| **holographic** | local | v0.1.0 | Local SQLite fact store + FTS5 search + trust scoring + HRR compositional retrieval. No pip deps. Hook: on_session_end. |
| **honcho** | API key / local | v1.0.0 | AI-native user modeling — dialectic Q&A, semantic search, persistent conclusions. pip: honcho-ai. Hook: on_session_end. |
| **mem0** | API key / local | v1.0.0 | Server-side LLM fact extraction + semantic search + reranking + auto-deduplication. pip: mem0ai. |
| **hindsight** | API key / local | v1.0.0 | Knowledge graph + entity resolution + multi-strategy retrieval. pip: hindsight-client>=0.4.22. Hook: on_session_end. |
| **openviking** | API key / local | v2.0.0 | Context database — auto-extraction, tiered retrieval, filesystem-style knowledge browsing. pip: httpx. Needs OPENVIKING_ENDPOINT. Hook: on_session_end. |
| **retaindb** | API key | v1.0.0 | Cloud memory API — hybrid search, 7 memory types. pip: requests. Needs RETAINDB_API_KEY. |
| **byterover** | local | v1.0.0 | Persistent knowledge tree, tiered retrieval via `brv` CLI. External dep: brv binary. Hook: on_pre_compress. |
| **supermemory** | API key | v1.0.0 | Semantic long-term memory — profile recall, semantic search, explicit memory tools, session ingest. pip: supermemory. |

View current (Historical (Hermes era) CLI): `hermes memory status` / configure: `hermes memory setup`. Current-stack equivalent: Mnemosyne stats (`mnemosyne_stats`) and the pi extension list.

## Evaluation Framework

When evaluating whether to add an external plugin on top of built-in T0-T4:

1. **Overlap check** — which T0-T4 layer already covers this capability? (Historical (Hermes era) mapping; verify against Mnemosyne/pi at adoption)
   - FTS5 search → T1 recall (Historical (Hermes era): `session_search`; current stack: `mnemosyne_recall`) already handles this
   - Fact store → T0 (Historical (Hermes era): MEMORY.md; current stack: Mnemosyne working bank) already handles this
   - Fact extraction → manual T0 maintenance, not automated
   - Semantic search → not currently in T1 (it's FTS5 keyword-based)

2. **Pain point alignment** — does the plugin solve a real current problem?
   - T0 capacity (80%) → compression/migration issue, not a retrieval gap
   - T1 recall quality → FTS5 is keyword-only; semantic search could help
   - Cross-session user modeling → T0 + T1 sufficient for single-operator setup

3. **Maturity** — v0.1.0 plugins carry breaking-change risk
   - holographic: v0.1.0 — too early for operational dependency
   - honcho, mem0, hindsight, retaindb: v1.0.0+

4. **Complexity budget** — each plugin adds:
   - Another source-of-truth layer (conflict risk with T4 > T3 > T2 > T1 > T0)
   - Another dependency to maintain (pip, external binary, or API key)
   - Another hook to monitor (on_session_end, on_pre_compress)

## Decision Record (2026-06-17)

**Operator asked about holographic and honcho.**

Recommendation: **Not needed yet.** Reasons:
- T0-T4 architecture already covers fact storage, session recall, and user preferences
- Real pain point is T0 capacity (80% → needs compression, not another layer)
- holographic is v0.1.0 — evaluate when v1.0+
- honcho is designed for multi-user consumer agents, not single-operator setups
- Adding a plugin before exhausting internal compression options adds complexity without solving a current problem

**Revisit when:**
- T0 is fully compressed and still overflowing
- Multiple users/clients need separate user modeling
- holographic reaches v1.0+ and ASTRAL audits it
- T1 FTS5 recall quality becomes a bottleneck (semantic search would help)
