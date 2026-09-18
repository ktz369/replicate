---
name: compound
description: "Promote one recently solved, verified problem into a durable concept in the knowledge/ OKF bundle."
argument-hint: "[optional: brief context] [mode:non-interactive]"
---

# Compound

Adapted from EveryInc's `ce-compound` (MIT) for this repo's OKF/Mnemosyne stack — see `AGENTS.md` § Knowledge & memory.

**Outcome:** one solved problem is written as a durable concept under `knowledge/`, grounded against the current tree, with provenance frontmatter, discoverable by the next agent.

**One learning per run.** A session that produced several gets several sequential runs, never one batched run — batching dilutes evidence and skips dedupe checks.

## Preconditions

Document a problem that is **solved**, **verified working**, and **non-trivial**. Judge these from the session rather than asking. When the session plainly holds no such problem, write nothing and report why — that is a successful run, not a failure.

Non-interactive mode (token `mode:non-interactive`) asks no questions of any kind and ends with exactly one terminal signal: `Documentation complete` or `Documentation skipped: <reason>`.

## Procedure

1. **Verify the fix is real.** Pull the evidence from this session: commands run, key output, tests that pass. If you cannot cite concrete evidence, skip with `Documentation skipped: no verifiable evidence`.

2. **Dedupe.** Search `knowledge/*.md` (titles, descriptions, bodies) for an existing concept covering the same lesson. If one exists and is still accurate, **update it in place** instead of creating a near-duplicate; note the update in its body and refresh its `generated.at`.

3. **Write the concept** at `knowledge/<slug>.md` (`<slug>` = short-hyphenated lesson name):

   ```markdown
   ---
   type: Learning
   title: <one-line lesson>
   description: <one sentence>
   tags: [<area>, ...]
   status: draft
   generated:
     by: <actor>                      # e.g. codex/gpt-5.6 — actor convention: producer/version
     at: "<ISO 8601 now>"
   sources:
     - id: fix-commit                 # REQUIRED per entry: resource; id when cited in body
       resource: <commit sha URL, session/memory path, or file path>
       title: <what this source is>
   ---

   # <Lesson title>

   ## Problem
   ## Diagnosis
   ## Fix
   ## Evidence      # real command output / test names — no fabrication
   ## Caveats       # where this does NOT apply
   ```

   Rules:
   - Cite claims against `sources[].id` with markdown footnotes (`[^fix-commit]`).
   - **Never self-assign human review.** Omit `verified` entirely (tier: unverified) unless the user explicitly confirmed the result this session — then `verified: { by: human:<id>, at: ... }`. Machine-only verification may add `{ by: process:<id> }`.
   - Keep `status: draft` until a `/compound-refresh` pass promotes it to `stable`.

4. **Register it.** Add one row under `## Concepts` in `knowledge/index.md`; append a dated bullet to `knowledge/log.md`.

5. **Validate.**

   ```bash
   node .pi/npm/node_modules/pi-okf/bin/pi-okf.js validate knowledge
   ```

   Hard errors must be fixed before finishing. Warnings are reported, not hidden.

6. **Report.** Concept path, what changed (created vs updated), validation result, and any caveats. If nothing qualified, say so plainly.

## Boundary

Only `knowledge/` files are written. Edits to code belong elsewhere; edits to guidance (`AGENTS.md`, skills, `CONTEXT.md` terms) belong to `/compound-refresh`'s vocabulary step or a human — flag conflicts, never silently patch them.
