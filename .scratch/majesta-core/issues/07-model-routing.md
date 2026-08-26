# 07: Per-intent model routing + failover

**What to build:** Messages are classified by intent (quick chat / coding / research / long task) and the matching model is selected before session creation; rules live in a plain config file the owner edits. On provider failure, the alternate provider takes over automatically. Implemented as a thin model-pick step — no routing subsystem.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] Different intents demonstrably hit different configured models
- [ ] Mapping file edited without code change alters routing on next session
- [ ] Provider failure fails over to the alternate with evidence
- [ ] Misclassification degrades gracefully (sensible default model)
