# 02: E2E verification harness

**What to build:** `npm run e2e` runs scripted one-shot scenarios through the real CLI entrypoint against the real provider and asserts outcomes: exit code 0, non-empty streamed response, and a `memory_save` round-trip that visibly appends to MEMORY.md. Plus a documented manual interactive smoke checklist for what scripts can't catch (streaming feel, interrupt). "Verified" becomes repeatable evidence.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] `npm run e2e` green on current main with real provider credentials
- [ ] Memory round-trip scenario asserts MEMORY.md content after run
- [ ] Manual smoke checklist documented in the ticket/spec
- [ ] Harness fails loudly (non-zero exit) when any assertion breaks
