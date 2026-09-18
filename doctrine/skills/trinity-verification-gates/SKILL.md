---
name: trinity-verification-gates
description: Use when Trinity work needs preflight and post-action checks that confirm T4 was consulted, boundaries were respected, and outputs are actually verified before they are treated as done. Enforces final gate discipline.
version: 1.0.0
author: ASTRAL
license: MIT
# Historical (Hermes era): original skills used a `metadata.hermes` block.
# Renamed to provenance — same fields, no runtime meaning on the pi stack.
metadata:
  provenance:
    original_block: metadata.hermes  # Historical (Hermes era)
    tags: [trinity, verification, gates, t4, boundary, approval]
    related_skills: [trinity-mode-default, trinity-mode-operating-anchor, trinity-agent-routing]
---

# Trinity Verification Gates

## Overview

This skill prevents fake completion.

It makes the assistant prove that the current state was checked, the boundary was respected, and the result was verified before the work is called done.

## When to Use

Use when:
- a task may affect runtime state
- a session result must be trustworthy
- a doc or agent report needs validation
- the operator wants strict completion discipline

## Gates

### Gate 1 — Scope
Confirm the task is actually the task requested.

### Gate 2 — Source
Confirm the authoritative layer:
- T4 for live state
- T1 for recall
- T2 for procedure
- T3 for explanation

### Gate 3 — Boundary
Confirm the action is within approval and does not expand scope silently.

### Gate 4 — Verification
Check the actual artifact, file, output, or runtime response instead of trusting a summary.

### Gate 5 — Reporting
Report only what was verified.
Do not report inference as fact.

## Typical Checks

- read back written files
- inspect git diff or file contents after edits
- verify produced paths exist
- confirm a service or state change with a live check
- compare agent self-report against the underlying artifact

### Inline Handoff / Slice Closure Gate

When the operator says **inline** for a Trinity/HCR handoff or slice:
1. re-verify T4 first (`git status`, current artifact state, runtime state as applicable) before trusting the handoff
2. do not dispatch workers, unblock for worker execution, or use delegated agents
3. execute only the requested remaining tasks; do not drift into push/commit/deploy/restart/config/workbook mutation without explicit approval
4. inspect any handoff caveats while in scope; if a small local contract mismatch is found and can be fixed without external consequence, fix it and re-run verification
5. run the direct verification commands after changes; report exact pass/fail results
6. report approval-gated leftovers separately as **blocked**, not as incomplete execution

### Inline Kanban Slice Gate

Historical (Hermes era): on that stack, kanban slices were tracked and closed with
the `hermes kanban` CLI cards (Historical (Hermes era): `show`/`comment`/`complete`). On the current pi/bb stack the
equivalent is a **bb task**: inspect it with `bb tasks show <KEY>` and treat its
description/body as scope; add a concise `bb tasks comment <KEY> --body '...'` naming what
was verified and what was not; move status only after verification via
`bb tasks update <KEY> --status <status>` (board statuses are e.g. `todo`/`backlog` →
`done`; use `--json` to confirm the write). The same gate rules apply unchanged:

1. inspect the bb task with `bb tasks show <task-key>` and treat its body/acceptance as scope
2. do not dispatch workers, unblock for worker execution, or use delegated agents
3. implement only the active slice; do not continue into the next blocked task unless the operator explicitly says to continue
4. run the slice's direct verification commands before changing task status
5. only mark the task complete after the artifact/build/test result is verified
6. add a concise `bb tasks comment` completion summary that names what was verified and what was not
7. the actual CLI subcommands:

```bash
bb tasks show <task-key>
bb tasks comment <task-key> --body '<concise verified summary>'
bb tasks update <task-key> --status <status>   # e.g. done
bb tasks list
```

Pitfall: `bb tasks` has no `done` subcommand — status is set via
`bb tasks update <KEY> --status done`. Passing the new status only in prose (without the
`--status` flag) does not update the task.

If verification is blocked by local setup, report the setup gap and leave the task unfinished unless the operator approves resolving the setup gap inline.

### Kanban Slice Verification Gate

Historical (Hermes era): the original gate read a kanban board and its option order
(`hermes kanban --board <board-slug> list` — global `--board` before the subcommand; Historical (Hermes era)). On the
bb stack the equivalent is `bb tasks list` (no board flag exists; the project is the board).
To mark a verified slice complete, use the actual CLI update form:

```bash
bb tasks update <task-key> --status done
```

Do not use `done` as a subcommand; `done` is a status label, not a `bb tasks` action.

If post-work verification cannot run because the local environment is missing a required tool, do not mark the task complete. Leave the task in its current blocked/ready state and add a `bb tasks comment` with the verified artifact paths and the blocked verification command.

## Automation Ordering Gate

When an automation must both **prepare an artifact** and **notify/send based on that artifact**, enforce the ordering in code, not only in prose instructions.

Required shape:
1. detect condition from T4
2. create or refresh the required artifact
3. verify it exists and is readable/non-empty
4. only then allow notification or downstream send

Preferred implementation pattern:
- put steps 1–3 in a deterministic script or other preflight
- make the LLM/agent consume only the verified preflight output
- do **not** let the LLM re-derive the candidate set independently if that could bypass the gate
- match the file extension/entrypoint to the interpreter the scheduler will actually use (`.py` for Python, `.sh` for shell). A correct preflight with the wrong entrypoint is not a verified gate; it is dead code until runtime artifacts prove execution.
- after rewiring a scheduled job, verify the **newest scheduler artifact** shows the expected script output / interpreter path. Persisted config alone is only declarative intent, not proof the runtime used it.
- when a cron prompt instructs the job to call a delivery tool (for example a Telegram notify script such as `tg-notify.sh`, or another notification path), verify the job's tool contract actually exposes that path. A job can show `last_status: ok` while still failing its real task if the prompt/tool contract and its restriction disagree. (Historical (Hermes era): the equivalent check was a job's `enabled_toolsets` exposing `send_message`.)
- if a cron job config is updated to expose a new delivery path and the next forced run still reports that the tool is unavailable, treat that as a **runtime reload failure until proven otherwise**. Config state changing on disk is not enough. The verification sequence is: update job config → trigger a run → inspect the newest cron output artifact for actual tool availability → if the artifact still says the tool is unavailable, restart/reload the scheduler runtime before drawing any conclusion about the tool name.
- if a cron job has a **generic scheduler header** that conflicts with the job-specific prompt body (for example the header says "do NOT use the delivery tool" but the watchdog body requires direct delivery), treat that as a prompt-precedence incident, not as proof the tool is still broken. Repair the job prompt so the job-specific override is explicit, then force a run and verify the newest artifact shows actual send success/failure. Important nuance: the cron artifact may still display the old generic header at the top even after the effective prompt was repaired. In that case, trust the runtime outcome gate: if the artifact shows `Sent: N` and the target send succeeded, the delivery path is proven healthy even if the rendered prompt block still looks contradictory.

Example class: context-window watchdogs. If the policy says "handoff brief must exist before warning delivery," the watchdog should emit only records that already include a verified handoff path. The sender should never have a code path that can say "no verified handoff exists yet" after deciding to warn.

## Tiered Verification Pattern

When the operator asks "is X verified?" and the ideal source (T4/runtime) is unavailable:

1. **Tier 1 — Runtime dispatch**: the only confirmed path. Dispatch the agent, read the actual response. If blocked (admin down, no VPS access), do NOT pretend config == runtime.
2. **Tier 2 — Config audit**: file-level verification. Confirm every agent's config declares the expected fields/skills. This proves **declarative intent**, not runtime truth.
3. **Always label the tier**: say "config-only, not runtime-verified" when falling back from Tier 1. Never let a config audit masquerade as a dispatch test.
4. **Surface the gap**: if Tier 2 is clean but Tier 1 is untested, say so explicitly — "15/15 wired in config, zero runtime evidence." (The 15/15 figure is a Historical (Hermes era) roster size — re-verify at adoption.)

This also applies to:
- Skill bundles: verifying config lists the skills ≠ verifying the runtime loaded them
- Channel prompts: verifying the config file has the entry ≠ verifying the agent received it
- Agent roster: verifying the file exists ≠ verifying the agent process is running
- Cron direct-delivery repairs: verifying the job is `enabled`, `scheduled`, `last_status: ok`, or that the prompt now instructs delivery ≠ proving the cron runtime can actually deliver on this tick

### Runtime-Healthy vs Outcome-Healthy (cron / watchdogs)

A scheduled job can look healthy at the scheduler layer while still failing its real mission.

Treat these as **scheduler-health only**, not outcome proof:
- `enabled: true`
- `state: scheduled`
- `last_status: ok`
- toolset/restriction config left permissive
- prompt/config text that says the job should send direct alerts

For watchdogs that must send direct thread/DM warnings, the verification ladder is:
1. confirm the job exists and is scheduled
2. confirm the preflight/script produced the expected verified payload
3. inspect the **latest runtime artifact / cron output** for actual send success or failure
4. if the latest proven artifact says the send tool was unavailable, classify the job as **detection active, direct delivery unverified/broken** until a newer post-restart tick proves otherwise
5. do not upgrade the verdict from config improvements alone

This prevents a common false-positive report: "the watchdog is active for all threads" when the true state is only "global detection is active, but direct delivery is still not runtime-proven."

### Browser-Rendered UI Proof Gate

When a handoff or task asks for browser-rendered UI proof, keep these tiers separate:
1. **Build proof** — `npm run build` or equivalent proves bundling only.
2. **Server reachability** — `curl -I http://127.0.0.1:<port>/` proves an HTTP surface responds only.
3. **Browser launch readiness** — the headless browser must actually launch; installing a browser binary is not enough if system shared libraries are missing.
4. **Rendered proof** — screenshot/DOM assertion from the browser session is the proof.

Reporting rule: do not call browser proof done from build success or HTTP 200 alone. If dependency installation needs root/admin approval or fails before browser launch, classify the proof as blocked and name the exact launch error. Do not mark the dependency step complete until a browser launch succeeds.

### Config / Heartbeat / Runtime Split (important)

When a system has:
- a declarative binding/config file,
- a heartbeat or health-check job (mini-cron / cron bb),
- and a claimed live interaction flow,

do **not** treat those as the same verification tier.

Use this split:
1. **Binding/config verified** — the YAML/TOML/JSON declares an intended route or workflow.
2. **Heartbeat verified** — a cron or watchdog proves the file exists, looks healthy, or basic invariants hold.
3. **Live runtime verified** — there is evidence that the real flow executes end-to-end (for example: reads inbound messages, matches trigger, routes thread, writes artifact, or sends outbound response).

Reporting rule:
- "binding exists" ≠ "bridge runs"
- "heartbeat OK" ≠ "runtime flow exists"
- "file healthy" ≠ "operator/client lane is live"

Required wording when only tiers 1–2 are proven:
- say **"config present, health-check running, live flow unverified"**
- avoid phrases like "bridge active" or "wired" unless tier 3 has runtime evidence

Typical failure pattern this avoids:
- seeing a binding file + green mini-cron/cron logs
- inferring the full Telegram/agent bridge is operational
- later discovering the script only checked file existence and never executed the actual business flow

### Prompt-Fix vs Tool-Exposure Gate (cron direct-delivery repairs)

When a cron watchdog fails to send direct warnings, do **not** collapse all causes into "prompt issue" or "tool issue" after a single run.

Use this split diagnosis:
1. **Prompt/priority conflict** — the artifact shows the agent refusing to call the delivery tool because a higher-priority instruction says not to use it. (Historical (Hermes era): the canonical example was `send_message`.)
2. **Runtime tool-exposure failure** — the artifact shows the delivery tool is unavailable in the execution environment even though the job prompt explicitly requires it.

Repair order:
1. fix the prompt contradiction first if it exists
2. force a run and inspect the new artifact
3. if one run succeeds, do **not** declare the lane stable yet
4. force another run (or inspect the next natural tick) to confirm the tool exposure is consistent across runs
5. if success flips back to "delivery tool unavailable", classify the system as **prompt-fixed but runtime-flaky**

Reporting rule:
- "prompt fixed" is narrower than "delivery fixed"
- a single successful send proves the path can work, but **not** that the cron runtime is stable
- final outcome should be labeled one of:
  - `prompt still conflicted`
  - `prompt fixed, delivery unverified`
  - `prompt fixed, one successful send, stability not yet proven`
  - `prompt fixed, runtime tool exposure flaky`
  - `delivery stable across consecutive verified runs`

This avoids the bad conclusion: "issue resolved" after the first successful forced run when the next tick regresses to missing tool exposure.

### Telegram Topic Runtime-Proof Gate

When proving Telegram topic-bound skill autoload or same-session reinjection behavior, keep outbound-send proof separate from inbound-runtime proof.

Historical (Hermes era): this gate was written against the Hermes Telegram gateway, whose
log lines (Hermes-era formats, quoted below) were the (Historical (Hermes era))
canonical runtime artifacts, with `send_message` as the outbound tool (Historical (Hermes era)). The gate's logic is
unchanged on the pi/bb stack: keep outbound-send proof separate from inbound-runtime proof.
Map the artifact names to whatever the current bridge logs (mini-cron/bridge artifacts,
`tg-notify.sh` output, pi session JSONL transcripts) — do not treat the quoted line
formats below as live pi log formats. (Historical (Hermes era) formats throughout.)

Strong runtime proof requires a real inbound handling artifact for the target topic, such as:
- a live bridge/gateway log line showing the inbound topic dispatch (Hermes-era format, Historical (Hermes era):
  Historical (Hermes era):
  `Flushing text batch agent:main:telegram:group:<chat_id>:<topic_id>`)
- an inbound message log line for the target topic/session (Hermes-era format, Historical (Hermes era):
  Historical (Hermes era):
  `inbound message: platform=telegram ... chat=<chat_id> ...`)
- a response-ready log line for that same dispatch (Hermes-era format, Historical (Hermes era):
  Historical (Hermes era):
  `response ready: platform=telegram chat=<chat_id> ...`)
- a runtime/session transcript artifact (e.g. the pi session JSONL) showing
  `Auto-loaded skill(s) ['<skill>']` or the injected skill payload

Weak signals are not enough by themselves:
- outbound send-tool success to `telegram:<chat_id>:<topic_id>` (Historical (Hermes era):
  `send_message` success — Historical (Hermes era))
- Telegram `message_id` returned by an outbound send
- visually seeing a message appear in the topic
- gateway log lines that only show `Sending response ... to <chat_id>` without the topic session key
- a session reset for the topic without a following inbound/response-ready sequence

If the test used tool-sent or mirrored messages only, report the result as **send path proved, inbound runtime not proved**. For fresh-session autoload proof, prefer having the operator send one manual message directly in the target topic, then watch logs for the topic session key before testing the second turn.

## Anti-Patterns

Avoid:
- claiming success before checking the artifact
- trusting a self-report without validation
- skipping boundary checks because the task feels small
- merging runtime state with explanation
- presenting config-only verification as runtime truth
- letting "all files look right" substitute for a dispatch test
- **trusting T0 memory post-compaction without re-verification.** When a session's context window is compacted, earlier turns are summarized away — T4 verification history is deleted but T0 memory persists. (Historical (Hermes era): the gateway auto-compacted around ~100 messages; on the pi stack, treat any compaction/summary event the same way.) Post-compaction, the only remaining "truth" is T0, which is T1-equivalent recall. Re-verify all T4-sensitive T0 entries (thread IDs, agent mappings, runtime facts) after compaction events. See `memory-architecture` skill — Context Compaction section for the full doctrine.
- **conflating "detection active" with "delivery healthy" for context-window / direct-alert watchdogs.** A watchdog that scans session state and writes handoff briefs is **detection-active** the moment its preflight succeeds. But that is a different gate from **delivery-healthy**, which requires the scheduler's runtime to actually deliver (via the notification path, e.g. a Telegram notify script) to each flagged target. The two states must be reported separately. Reporting "watchdog is active for all threads" without distinguishing the two is the most common false-positive in watchdog triage.

### Correction Inference (CRITICAL)

When the operator corrects an incident ("X is actually at Y"), **do not promote the correction to a canonical fact without T4 verification.** The correction may be about *which target got hit by the mistake*, not about the permanent mapping.

Operator: "ASTRAL bener di thread 4, tapi kamu awalnya ngacau."  
Agent (wrong): "ASTRAL's thread is 4 — memory updated."  
Agent (correct): "You mean ASTRAL's permanent thread should be 4, or the message I sent wrongly landed in thread 4?" → then verify against T4 runtime truth (Historical (Hermes era): the equivalent check read `sessions.json`).

**Rule:** any operator statement about thread IDs, agent mappings, or runtime state must be cross-checked against T4 before being stored as truth. A correction about an *incident* is not the same as a canonical declaration.

## References

- `references/context-window-watchdog-runtime-verification.md` — runtime-proof pattern for scheduled automations that must create and verify artifacts before notification.

## Verification Checklist

- [ ] Task scope matched the request
- [ ] T4 or the correct source layer was consulted
- [ ] Boundary / approval constraints were checked
- [ ] Artifact or runtime state was verified directly
- [ ] Final report only states what was actually checked

---

## PACI-X Cutover Note (2026-09-05, ticket 04b)

This skill was ported from the Hermes chat-harness profile (Historical (Hermes era) origin). Harness-specific
references (Hermes gateway cron/kanban commands — Historical (Hermes era) — and Telegram delivery targets,
surface locks, Hermes context compaction) are **historical record** — the
current runtime is the pi coding-harness profile (`pi-paci-x`). Where a
procedure depends on a Hermes-only mechanism (Historical (Hermes era)), use its cutover equivalent
(mini-cron + scripts/cutover/*, bb tasks, direct Telegram via tg-notify.sh)
or stop and ask the operator before improvising.
