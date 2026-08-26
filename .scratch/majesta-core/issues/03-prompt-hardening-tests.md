# 03: Prompt hardening + unit tests

**What to build:** The system prompt becomes contract-tested via node:test over temp-dir fixtures: template placeholders fully substituted (and validated), oversized MEMORY.md injection bounded with a truncation marker instead of silent inclusion, fallback identity when SOUL.md is missing, and stable tier ordering. Whatever the tests expose as broken gets fixed.

**Blocked by:** None (can start immediately).

**Status:** closed

- [x] `npm test` exists and passes without network or real credentials
- [x] Substitution, bounding, fallback, and tier-order behavior each covered
- [x] Any defect the tests found is fixed with evidence in the ticket comments

## Comments

### agent · 2026-08-26

**Claimed** — scope: `tests/` + fixes to `src/system-prompt.ts` exposed by the tests.

### agent · 2026-08-26

**Defects the tests exposed (both in `src/system-prompt.ts`):**

1. **Unbounded MEMORY.md injection.** The context tier included MEMORY.md verbatim,
   however large. Fixed: content is capped at `MAX_MEMORY_CHARS` (4096) with an explicit
   marker `[MEMORY.md truncated: showing first 4096 of N characters]`.
2. **Silent placeholder leakage / no validation.** Unknown `{{TOKENS}}` in SOUL.md passed
   straight into the live prompt. Fixed: `renderTemplate()` now throws listing the
   unsubstituted placeholders, so a stale template fails loudly at build time.

Testability refactor (smallest honest diff): `buildSystemPrompt()` gained an optional
`{ cwd, home, now }` options object defaulting to prior behavior; no call sites changed.

**Evidence:**

```
npm test  →  ✔ 6/6 pass (substitution, unknown-placeholder rejection,
             oversized-memory bounding, small-memory verbatim,
             missing-SOUL fallback, tier ordering)
npm run e2e  →  2/2 scenarios PASS (regression check against real CLI)
```

Real-repo sanity render: prompt contains MAJESTA identity, zero leftover `{{` braces.
