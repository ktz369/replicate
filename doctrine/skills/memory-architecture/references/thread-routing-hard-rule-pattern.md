# THREAD-ROUTING HARD RULE — Deployment Pattern

Deployed 2026-06-04 after Trinity doctrine violation incident.

Historical (Hermes era) deployment record: on that stack this rule lived in a
channel_prompts config (see also the verbatim rule text below, which
quotes the same files for that same reason). On the pi/bb stack, deploy the
same rule text into whatever channel-prompt surface the operator approves (pi profile
prompt surfaces, AGENTS.md doctrine, or bb task/thread doctrine) — the rule's meaning is
unchanged.

## What It Is

A hard rule inserted into the channel-prompt surface (Historical (Hermes era): `config.yaml` channel_prompts) that mandates T4 verification before any cross-thread send.

## Rule Text

```
THREAD-ROUTING HARD RULE (2026-06-04): Before any cross-thread send_message (Historical (Hermes era) wording — see labeled note above),
verify the target thread_id against canonical agent-thread mapping in
config.yaml channel_prompts or sessions.json. Do NOT route by T0 memory or   <!-- Historical (Hermes era) wording -->
inference alone. Thread misrouting is a T4 doctrine violation. If uncertain,
cross-check both sources. Agent-thread mappings are RUNTIME TRUTH (T4), not
recall (T1).
```

(The quoted rule text is preserved verbatim as the Historical (Hermes era) deployment
record; for new deployments on the pi/bb stack, re-point the runtime-truth sources at
bb thread listings / pi session JSONL paths as in `memory-architecture` SKILL.md.)

## Deployment Points

Historical (Hermes era) touchpoints where agents routed cross-thread messages (thread IDs are Hermes IDs — re-verify at adoption; on the pi/bb stack these map to bb thread IDs):

| Touchpoint | Thread ID (Hermes era) | config.yaml key (Historical (Hermes era)) |
|------------|-----------|-----------------|
| DM (Luce) | 543640135 | `channel_prompts['543640135']` |
| Core Group | 1 | `channel_prompts['1']` |
| ASTRAL | 856 | `channel_prompts['856']` |

## Insertion Method

Historical (Hermes era): in `config.yaml`, the rule was inserted immediately after the "This applies to all 15 HCR agent threads, not just Core Group." line in each target block, before the next `'<thread-id>':` entry. The closing single quote moved to the end of the hard rule paragraph.

**Hot-reload:** Historical (Hermes era): channel prompts reloaded without gateway restart. On the pi/bb stack, verify how the chosen prompt surface picks up changes before assuming hot-reload.

## Remaining Gap

Historical (Hermes era) status: only 3 of 15 thread prompts had the hard rule. Remaining threads were to be patched as a gradual rollout. Priority: threads whose agents do frequent cross-thread communication (Core Group, DM, infrastructure agents). On the pi/bb stack, re-derive the thread roster at adoption.

## Related

- Postmortem: `docs/architecture/trinity/doctrine-violation-2026-06-04.md`
- Cross-reference: `trinity-verification-gates` skill — Correction Inference section
- Cross-reference: `memory-architecture` skill — Context Compaction section