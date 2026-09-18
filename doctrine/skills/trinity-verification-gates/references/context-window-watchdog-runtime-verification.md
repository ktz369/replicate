# Context-window watchdog runtime verification

Use this reference when auditing automations that must create a handoff/artifact before sending a warning or reset instruction.

## Durable lessons

- Prompt prose is not a sufficient enforcement mechanism for ordering-critical automations.
- Put gating steps in deterministic preflight logic:
  1. detect from T4
  2. create/refresh handoff artifact
  3. read it back and verify non-empty/readable
  4. emit only verified records to the sender stage
- Narrow the downstream agent prompt so it consumes only the preflight payload and does not re-scan the live source independently.
- Scheduler truth comes from runtime artifacts, not job definitions alone.

## Verification pattern

When fixing a scheduled automation:

1. Verify the persisted job definition points to the intended script.
2. Verify the script file contents match the intended interpreter.
3. Audit the job's runtime tool contract before testing delivery:
   - read the prompt/instructions
   - list the exact tools the prompt expects to call (delivery tool — Historical (Hermes era): `send_message` — file reads, terminal, etc.)
   - verify the job's toolset/restriction config actually loads those tools (Historical (Hermes era): the `enabled_toolsets` field)
   - if the prompt requires a tool that the job's restriction excludes, treat that as a delivery-path misconfiguration even if the preflight script is correct.
4. Force a run.
5. Inspect the newest scheduler output artifact.
6. Confirm the artifact contains the expected script output and ordering proof.
7. Treat delivery-path failures separately from ordering failures.

## Common pitfall

A Python preflight stored in a `.sh` file can look correct in source review and manual reasoning, but still fail in scheduler runtime because the scheduler dispatches by extension/interpreter convention. That means:
- source review is not enough
- manual file existence is not enough
- persisted cron config is not enough
- only the produced runtime artifact proves the gate is live

## Reporting rule

Separate these conclusions explicitly:
- ordering enforcement fixed / not fixed
- runtime script execution fixed / not fixed
- downstream delivery available / unavailable

Do not collapse them into one status.