---
name: trinity-session-routing
description: Use when Trinity sessions need the correct anchor order, re-anchoring behavior, and source selection before execution begins. Keeps the session from starting in generic-assistant mode.
version: 1.0.0
author: ASTRAL
license: MIT
# Historical (Hermes era): original skills used a `metadata.hermes` block.
# Renamed to provenance — same fields, no runtime meaning on the pi stack.
metadata:
  provenance:
    original_block: metadata.hermes  # Historical (Hermes era)
    tags: [trinity, routing, anchor, session, control-room]
    related_skills: [trinity-mode-default, trinity-mode-operating-anchor, trinity-memory-placement]
---

# Trinity Session Routing

## Overview

This skill chooses the correct entrypoint for a Trinity session.

The objective is simple: do not start from vibes, start from the right anchor.

## When to Use

Use when:
- a session starts in Trinity / Control Room mode
- the user gives a short prompt that depends on prior context
- the conversation may need re-anchoring after a scope change
- you need to decide which doc or source to read first

## Routing Rules

### 1. Anchor first
If an anchor exists, read it before doing anything else.

### 2. Re-anchor on scope change
If the question changes domain, boundary, or runtime target, do not drag stale context forward. Re-anchor.

### 3. Prefer the newest relevant Trinity artifact
If several docs exist, use the newest relevant one unless a canonical doc explicitly overrides it.

### 4. Prefer runtime over recall
If live state is available, use it instead of reconstructing from memory.

### 5. Separate question types
Classify the prompt before answering:
- runtime state question → T4
- prior discussion question → T1
- procedure question → T2
- explanation / handoff question → T3

### 6. Thread reference clarification
When the operator mentions a thread ID in a correction or direction ("X is at thread N"), clarify before acting:
- Is this a permanent canonical declaration ("X's thread is now N permanently")?
- Or an incident-specific reference ("the message you sent landed in thread N")?
Incident references must NOT update canonical thread mappings. Verify against runtime truth (T4) — on the pi/bb stack, the bb thread list (`bb thread list` / `bb status`) and pi session JSONL paths — before any mapping change. (Historical (Hermes era): the equivalent check read `sessions.json`.)

### 7. Consulting another lane/persona
When the operator asks one lane/persona to consult another (for example Turing asking Saturn about a workbook), treat it as cross-thread routing, not local reasoning.
- Verify the destination from T4/runtime target sources before sending.
- Prefer canonical runtime sources such as bb thread listings or the environment's configured channel mapping when available.
- If canonical runtime sources are unavailable in the current environment, resolve targets with the bb CLI (e.g. `bb thread list`) and use the exact listed target label; do not infer from memory alone. (Historical (Hermes era): targets were resolved with `send_message(action="list")`.)
- Keep the sent question short and scoped to the operator's requested artifact or decision.
- Do not claim the consulted lane's answer until a response or artifact is actually available.

## Routing Pattern

Use this sequence:
1. identify the question type
2. identify the authoritative layer
3. load the anchor or doc for that layer
4. verify the current state if needed
5. only then answer or act

## Anti-Patterns

Avoid:
- generic assistant framing
- answering from stale context
- skipping anchor docs because the prompt seems obvious
- treating docs as runtime truth
- continuing after scope drift without re-anchoring
- treating config presence or code-path existence as proof of live runtime behavior

## Runtime-proof rule

When the operator asks for **proof** that a routing/binding path happened at runtime (for example a topic-bound skill load on fresh inbound dispatch), distinguish three levels clearly:

1. **config proof** — the binding exists in config
2. **code-path proof** — source shows the runtime would set and inject the binding
3. **runtime proof** — a live artifact confirms it actually happened

Do not collapse (1) or (2) into (3).

For runtime-proof questions, require at least one of:
- a live log line from the active runtime
- a session/transcript artifact showing the injected skill or prompt payload
- an end-to-end test that simulates the fresh inbound path and asserts the binding/injection

If live observability is missing, prefer a **minimal test pathway** before changing production logging, unless the operator explicitly wants runtime observability work.

## Verification Checklist

- [ ] Question type identified
- [ ] Correct anchor selected
- [ ] Scope changes triggered re-anchoring
- [ ] Runtime questions were routed to T4
- [ ] No generic mode leakage
