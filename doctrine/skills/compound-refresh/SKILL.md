---
name: compound-refresh
description: "Audit the knowledge/ OKF bundle against the current codebase: fix stale, overlapping, superseded, or contradictory concepts."
argument-hint: "[optional: scope hint — slug, tag, or keyword] [mode:non-interactive]"
---

# Compound Refresh

Adapted from EveryInc's `ce-compound-refresh` (MIT) for this repo's OKF bundle — see `AGENTS.md` § Knowledge & memory.

**Outcome:** every concept in `knowledge/` can be trusted again. The per-concept report is the deliverable; corrected files and `knowledge/log.md` entries are the residue.

## Scope

Candidates are `knowledge/*.md` except `index.md` and `log.md`. A scope hint that matches nothing **never widens**; report the miss and stop.

## Investigate

For each concept, check against the current codebase:

1. **Staleness** — does cited code/behavior still exist in this form? Re-run one piece of Evidence if cheap; otherwise read the code it names.
2. **Overlap** — do two concepts teach the same lesson?
3. **Supersession** — is one a newer framing of another?
4. **Contradiction** — does one actively mislead against code or against another concept? Contradiction outranks individual staleness: fix it first.

## Classify — exactly one outcome per concept

| Outcome | When |
|---|---|
| **Keep** | Verified accurate against current code |
| **Update** | Right lesson, drifted details — edit body/frontmatter, bump `generated.at`, add a dated line under `## Caveats` |
| **Consolidate** | Overlapping pair → merge into the stronger one, delete the weaker (git history is the archive) |
| **Replace** | Wrong lesson, same topic → rewrite body, keep provenance chain by adding the old commit to `sources` |
| **Delete** | No retrieval value AND unverifiable — requires explicit user consent in interactive mode; otherwise mark `status: deprecated` and recommend |

Two boundaries hold regardless of evidence:
- **Code vs doc disagree → the doc changes, not the code.** Code review is out of scope.
- **Concept contradicts guidance** (`AGENTS.md`, a skill, `CONTEXT.md`) → report both quotes; never edit the guidance file yourself.

## Trust maintenance

- A concept verified only by agents stays machine-confirmed at best.
- Promote `status: draft → stable` when investigation confirms accuracy; `stable → deprecated` when superseded.
- If the user explicitly confirms accuracy during an interactive pass, append `{ by: human:<id>, at: <now> }` to that concept's `verified`.

## Vocabulary step

Reconcile recurring domain terms surfaced during investigation with the glossary in `CONTEXT.md`: new term used ≥3 times across concepts → candidate entry. Report candidates; create glossary lines directly (this file is ours to edit).

## Finish

1. Apply all edits, including updated `knowledge/index.md` rows and dated `knowledge/log.md` bullets.
2. Validate: `node .pi/npm/node_modules/pi-okf/bin/pi-okf.js validate knowledge` — hard errors block completion.
3. Print the full markdown report, split into **Applied** and **Recommended**, one line per concept (`<slug>: <outcome> — why`). Never abbreviate the report away; in non-interactive mode it is the only output.

## Cadence

Run after every ~5 `/compound` captures, before any session that will *read* knowledge for implementation work, and whenever a concept gets cited and something feels off.
