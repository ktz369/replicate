# OxAgent — Agent Instructions

OxAgent is a personal agent inspired by the [hermes-agent](https://github.com/NousResearch/hermes-agent)
architecture, built on the **pi coding-agent harness** (SDK + extensions + skills) in TypeScript —
not a fork of Hermes' Python codebase.

Key directories:

- `src/` — core layer: `brand.ts` (identity/branding), `cli.ts` (terminal entrypoint), `system-prompt.ts` (SOUL.md → prompt composition)
- `extensions/memory.ts` — agent-curated memory loop (`memory_save` / `memory_search` tools)
- `gateway/gateway.ts` — messaging gateway (Telegram long-poll first; Discord et al. later)
- `soul/SOUL.md` — identity template injected as the system-prompt override
- `.pi/` — pi skills (`.pi/skills/`) and packages (`.pi/npm/`) that extend agent behavior

Status: **Slice 0 scaffold** — branding layer + memory loop + CLI proof-of-concept.

# AGENT EXECUTION RULES

## Hard constraints

These override every other consideration. A violation of any of these invalidates the work.

1. **Evidence required.** Never claim a task is complete without real evidence: command output,
   test results, file contents you have actually read. Show the trace, not a summary of what you
   believe happened.
2. **No fabrication.** Never invent file contents, API responses, test results, error messages, or
   citations. If you did not run it or read it, say so. An honest "I don't know / it failed" beats
   a confident fiction, always.
3. **Sacred data.** User data, production data, and credentials are sacred. Never modify, delete,
   exfiltrate, or echo them without explicit approval. Read-only access is the default; destructive
   operations against them require confirmation, no matter how small the change seems.
4. **Approval boundaries.** Stay inside the approved scope. Irreversible actions (deletes, force
   pushes, publishing, schema migrations, anything touching production) require explicit human
   approval before execution. When in doubt, ask; do not assume consent.
5. **Smallest honest diff.** Make the minimal change that fully solves the stated problem, and
   describe it accurately. No drive-by refactors, no speculative features, no hiding unrelated
   edits inside an unrelated-looking diff.

## Decision hierarchy

When principles conflict, resolve by priority: **B > A > C > D**.

- **Rule B — Compatibility boundaries (highest).** Do not break existing consumers: public APIs,
   on-disk formats, documented behavior, and other agents' assumptions about this repo. Migrations
   must be additive or versioned; breaking changes require an explicit, approved plan.
- **Rule A — Isolation & modularity.** Keep concerns separated. New behavior goes behind clean
   interfaces; shared state stays explicit; side effects stay at the edges. Prefer modules that can
   be understood and tested alone.
- **Rule C — Simplicity & incremental growth (YAGNI).** Build what is needed now, not what might
   be needed later. No speculative abstractions, no configuration for hypothetical use cases. Grow
   the design incrementally as real requirements arrive.
- **Rule D — Architectural integrity.** Follow the established architecture and patterns of the
   repo. If following them is impossible or would cause harm, surface the conflict instead of
   silently deviating. If a deviation or known limitation must be deferred, do not leave a bare
   `TODO` pointing at nothing: create a real task first via `bb tasks create` and cite its actual
   key in the comment, e.g. `TODO(ABC-12)`.

## Agent skills

### Issue tracker

Issues live as local markdown under `.scratch/<feature>/`, mirrored 1:1 to the bb Tasks board. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) are used verbatim. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Knowledge & memory

This project uses a five-layer knowledge map. Each layer has a distinct role — do not blur them:

| Layer | Role |
|---|---|
| `soul/SOUL.md` | Identity — who the agent is, values, voice |
| `CONTEXT.md` | Domain vocabulary — glossary terms and decisions-in-brief (see `docs/agents/domain.md`) |
| Mnemosyne (local SQLite) | Ephemeral session memory — raw, uncurated learnings captured during sessions |
| `knowledge/` OKF bundle | Curated, verified knowledge **with provenance/trust frontmatter** (`sources`, `verified`, …) |
| `.scratch/` + bb Tasks | Work-in-progress tickets and specs — not durable knowledge |

**Pipeline** (manual/periodic promotion — there is no daemon):

1. During sessions, capture learnings to Mnemosyne (e.g. `mnemosyne_remember`).
2. When a memory proves stable and verified, promote it into the `knowledge/` OKF bundle as a
   concept with `sources` frontmatter citing where it came from.
3. Validate the bundle with `pi-okf validate`.
4. Commit.

**Boundaries:** the OKF bundle does **not** replace `MEMORY.md`, `CONTEXT.md`, or session memory.
It is only the *promotion target* for memories that have graduated from ephemeral to curated.
