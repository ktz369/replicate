---
name: trinity-memory-placement
description: Use when Trinity work needs explicit placement rules for T0, T1, T2, T3, and T4 so runtime state does not leak into memory or docs. Enforces memory-tier hygiene and migration rules.
version: 1.0.0
author: ASTRAL
license: MIT
# Historical (Hermes era): original skills used a `metadata.hermes` block.
# Renamed to provenance — same fields, no runtime meaning on the pi stack.
metadata:
  provenance:
    original_block: metadata.hermes  # Historical (Hermes era)
    tags: [trinity, memory-layer, t0, t1, t2, t3, t4, routing]
    related_skills: [trinity-mode-default, trinity-mode-operating-anchor]
---

# Trinity Memory Placement

## Overview

This skill defines where information belongs in the Trinity memory stack.
The rule is simple:
- T0 is tiny.
- T1 is recall.
- T2 is procedure.
- T3 is explanation.
- T4 is live operational truth.
The point is not storage for its own sake. The point is keeping runtime state out of notes and keeping reusable doctrine out of memory spam.

## When to Use

Use when deciding where to store or retrieve:
- user preferences
- session context
- reusable SOPs
- architecture notes
- runtime task state
- projections, results, or events
- handoff content
- development state checkpoints that span sessions and environments

## Placement Rules

### T0 — hot memory
Store only:
- compact directives
- stable preferences
- short routing pointers

Do not store:
- task progress
- live state
- long explanations
- historical logs
- full project checkpoint descriptions (pointer only)

### T1 — session recall
Store/use for:
- prior discussion
- handoff reconstruction
- evidence of what was said

Do not treat as:
- current truth
- authoritative runtime state

### T2 — procedure / skills
Store/use for:
- SOPs
- playbooks
- reusable workflow rules
- stable doctrine

If a procedure should survive across sessions, it belongs here rather than in T0 or T3.

### T3 — docs / notes / handoffs
Store/use for:
- architecture docs
- design rationale
- reports
- human-readable explanation

T3 may summarize runtime state, but it does not become runtime truth.

### T4 — operational state
Store/use for:
- task state
- workflow state
- attempts and retries
- events
- results
- projections
- artifact refs tied to execution

If execution depends on the answer being current, the answer belongs in T4.

## Source-of-Truth Rules

- T4 wins for execution state.
- Contracts win for schema meaning.
- T2 wins for reusable procedure when it does not contradict T4 or contracts.
- T3 explains.
- T1 supports recall.
- T0 stays compact and non-authoritative.

## Migration Rule

When T0 gets crowded:
1. move stable procedure to T2
2. move explanation to T3
3. keep recall in T1
4. keep live truth in T4
5. keep T0 as a pointer layer, not a dump bucket

## Development Checkpoint Pointer Pattern

When a cross-environment project has its code on one machine and the agent on another, T0 should hold a short pointer (not full state):

```
<project> dev checkpoint: Phase N done, commit <hash>, branch <name>, repo <path> (<machine>). Skill: <skill-name>.
```

Full checkpoint details (verification commands, test counts, caveats) belong in T2 via skill references. See `references/majesta-checkpoint-migration-example.md` for a concrete example — MAJESTA OS Phase 8 checkpoint mapped across all five tiers including the anti-pattern of dumping state into T0.

## Anti-Patterns

Avoid:
- storing runtime state in memory
- letting docs override runtime truth
- turning session recall into a task queue
- bloating T0 with long doctrine
- promoting historical text into authority
- dumping full project checkpoints into T0 when a compact pointer + T2 reference suffices

## Verification Checklist

- [ ] Information was placed in the correct layer
- [ ] Runtime state was not stored in T0 or T3
- [ ] T4 was treated as the execution authority
- [ ] Durable procedure was moved to T2
- [ ] Recall was not mistaken for truth
- [ ] Project checkpoints use T0 pointer + T2 detail, not T0 dump