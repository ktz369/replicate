# 02: E2E verification harness

**What to build:** `npm run e2e` runs scripted one-shot scenarios through the real CLI entrypoint against the real provider and asserts outcomes: exit code 0, non-empty streamed response, and a `memory_save` round-trip that visibly appends to MEMORY.md. Plus a documented manual interactive smoke checklist for what scripts can't catch (streaming feel, interrupt). "Verified" becomes repeatable evidence.

**Blocked by:** 01.

**Status:** closed

- [x] `npm run e2e` green on current main with real provider credentials
- [x] Memory round-trip scenario asserts MEMORY.md content after run
- [x] Manual smoke checklist documented in the ticket/spec
- [x] Harness fails loudly (non-zero exit) when any assertion breaks

## Comments

**2026-08-26 — executed.** Built `scripts/e2e.ts` (`npm run e2e`): one-shot scenarios through the real CLI entrypoint against the real provider (`nous`/`stealth/ox-alpha`).

Two real defects surfaced while building the harness, both fixed:

1. **Memory extension never loaded** — `src/cli.ts` built the extension path with `new URL(...).pathname`, which percent-encodes spaces (`/app/Pi Project/` → `/app/Pi%20Project/...`), so pi rejected the path and MAJESTA's core memory loop was silently absent on any checkout path containing a space. Fixed with `fileURLToPath`. Diagnosed via loader diagnostics (`Extension path does not exist: /app/Pi%20Project/...`).
2. **Toolset nondeterminism from ambient extensions** — the user-scope global pi agent dir loads `/opt/data/.pi/extensions/mnemosyne-mcp.js`, which collides with both the project-scope `@mnemosyne-oss/pi-mnemosyne` package and our own tools; before fix 1 the model had no `memory_save` at all and flailed into broken `mnemosyne_remember`/bash calls. The harness now runs each scenario with `PI_CODING_AGENT_DIR` pointed at a temp agent dir that symlinks the real `models.json`/`auth.json` but ships an empty `settings.json` (drops user-scope extensions; project `.pi` packages still load — they are part of the product).

Scenarios:
- **S1 hello** — exit 0, non-empty streamed output, exact marker present.
- **S2 memory round-trip** — prompt instructs `memory_save`; asserts exit 0, `MEMORY.md` created under isolated `MAJESTA_HOME`, canary string present on disk.

Evidence:
```
$ npm run e2e
▸ S1 hello: exit 0 + non-empty streamed response ... PASS
▸ S2 memory round-trip: memory_save → MEMORY.md ... PASS
2/2 scenarios passed
E2E GREEN          # HARNESS_EXIT=0

$ # mutated assertion (marker cannot match):
▸ S1 ... FAIL
  ASSERT FAILED: expected marker in streamed output, got: ...
1/2 scenarios passed
E2E FAILURE — see details above.   # HARNESS_EXIT=1 (loud failure proven)
```

Also pre-added `npm test` (`node --import tsx --test "tests/**/*.test.ts"`) so tickets 03/05 don't collide on package.json; verified it exits 0 with zero test files.

### Manual interactive smoke checklist (what scripts can't catch)

Run `MAJESTA_HOME=$(mktemp -d) npm run cli` and verify:

1. **Startup** — banner prints (`MAJESTA — self-improving companion on the pi harness`), prompt `you ›` appears.
2. **Streaming feel** — response tokens appear incrementally, not as one blob.
3. **Interrupt** — Ctrl+C during a long response stops generation cleanly without corrupting the prompt.
4. **Session reset** — `/new` prints the reset note; a fact saved before `/new` is still found via `memory_search` afterwards.
5. **Memory command** — `/memory` prints the raw MEMORY.md path + contents.
6. **Cross-session persistence** — save a fact, quit, relaunch, ask about it; the answer must reflect the fact (system-prompt snapshot injection works).
7. **Tool visibility** — ask the agent which memory tools it has; it should name `memory_save`/`memory_search`.
