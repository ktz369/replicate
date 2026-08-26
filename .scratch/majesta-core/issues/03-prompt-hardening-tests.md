# 03: Prompt hardening + unit tests

**What to build:** The system prompt becomes contract-tested via node:test over temp-dir fixtures: template placeholders fully substituted (and validated), oversized MEMORY.md injection bounded with a truncation marker instead of silent inclusion, fallback identity when SOUL.md is missing, and stable tier ordering. Whatever the tests expose as broken gets fixed.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `npm test` exists and passes without network or real credentials
- [ ] Substitution, bounding, fallback, and tier-order behavior each covered
- [ ] Any defect the tests found is fixed with evidence in the ticket comments
