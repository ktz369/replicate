# T0 Watchdog Pattern

How to wire a recurring T0 memory check as a silent watchdog job. Use when T0 needs ongoing monitoring without burning LLM tokens.

Historical (Hermes era): the original pattern used `hermes cron` with `no_agent=True`. On the current pi/bb stack, the equivalent is **mini-cron** (a plain crontab file under `scripts/cutover` running a script directly) or a **cron bb** automation — the scheduler runs the script with no LLM in the loop, exactly preserving the watchdog shape below.

## Watchdog design (the only correct shape)

```
script (bash/python) → silent when under threshold
                     → alert text when over threshold
                     → non-zero exit on failure
no_agent=True cron job → script IS the job, no LLM loop   # Historical (Hermes era): hermes cron field; mini-cron/cron bb = plain script entry
                       → empty stdout = no delivery (silent)
                       → non-empty stdout = verbatim delivery
                       → non-zero exit = error alert
```

This is the cheapest possible monitoring: zero tokens, deterministic, fires only when there is something to report.

## Tool constraints (watchdog specifics)

Historical (Hermes era) tool-level facts from the `hermes cron` implementation are kept for context; the general lessons hold for mini-cron / cron bb:

1. **Script location must match what the scheduler allows.** (Historical (Hermes era): script path had to be in `~/.hermes/scripts/` and referenced by basename only; the scheduler rejected absolute paths with `Script path must be relative to ~/.hermes/scripts/`.) On the current stack, keep watchdog scripts under the repo (e.g. `scripts/cutover/`) and reference them the way the crontab file does.
2. **The script IS the job.** (Historical (Hermes era): `no_agent=True` required `script` and ignored prompt/skill fields.) mini-cron / cron bb behave the same way when the crontab entry invokes a script directly.
3. **No LLM in the loop.** The scheduler runs the script directly. No model override honored, no agent reasoning.
4. **Empty stdout = silent.** Design the script to print nothing when there is nothing to report. The user will not see a "tick" every interval.
5. **Non-zero exit triggers error alert.** Make the script exit 0 always (even on the no-alert path) so a successful run never fires the error channel.
6. **Delivery target controls where alerts land.** (Historical (Hermes era): default `origin` delivered to the creating chat; explicit routing used `deliver='telegram:<chat_id>:<thread_id>'`.) On the current stack, route delivery through the bridge notification path (e.g. `tg-notify.sh`) with the target the operator approved.

## Reference implementation: T0 size check (2026-06-04)

Script: a repo-local watchdog script (Historical (Hermes era): `~/.hermes/scripts/t0-watchdog.sh`)

```bash
#!/bin/bash
# T0 Memory Watchdog — silent when under 80% threshold.
# Pure bash, no bc/jq/python deps.

# Historical (Hermes era) paths shown; on the pi stack point these at the
# operator-approved T0-equivalent storage (Mnemosyne working bank / injected
# context files) and re-verify the limits at adoption.
MEM_FILE="/home/research/vava/hermes-data/.hermes/memories/MEMORY.md"  # Historical (Hermes era) path — re-verify at adoption
USER_FILE="/home/research/vava/hermes-data/.hermes/memories/USER.md"  # Historical (Hermes era) path — re-verify at adoption
MEM_LIMIT=2200
USER_LIMIT=1375
THRESHOLD_PCT=80

mem_chars=$(wc -c < "$MEM_FILE" 2>/dev/null || echo 0)
user_chars=$(wc -c < "$USER_FILE" 2>/dev/null || echo 0)

mem_pct=$((mem_chars * 100 / MEM_LIMIT))
user_pct=$((user_chars * 100 / USER_LIMIT))

alerts=""
[ "$mem_pct" -gt "$THRESHOLD_PCT" ] && alerts="${alerts}**MEMORY.md:** ${mem_chars}/${MEM_LIMIT} chars (${mem_pct}%)\n"
[ "$user_pct" -gt "$THRESHOLD_PCT" ] && alerts="${alerts}**USER.md:** ${user_chars}/${USER_LIMIT} chars (${user_pct}%)\n"

if [ -n "$alerts" ]; then
    echo "⚠️ T0 Memory Alert — threshold exceeded (80%)"
    echo ""
    printf "%b" "$alerts"
    echo ""
    echo "Run: ASTRAL memory-architecture → references/t0-emergency-cleanup-procedure.md"
fi
# Always exit 0 (silent or alert). Non-zero would trigger error channel.
exit 0
```

Job creation (Historical (Hermes era): `cronjob(action='create', ...)` tool call; current stack: add an entry to the mini-cron crontab file under `scripts/cutover`, or a cron bb automation):

```python
cronjob(          # Historical (Hermes era) tool call — kept as the pattern record
    action='create',
    name='t0-memory-watchdog',
    schedule='0 9 * * 0',              # weekly Sunday 09:00
    no_agent=True,                    # Historical (Hermes era) field
    script='t0-watchdog.sh',          # Historical (Hermes era): basename only, must be in ~/.hermes/scripts/
    deliver='telegram:<chat_id>:<thread_id>',  # explicit routing (Historical (Hermes era) field)
    workdir='<repo>'                   # optional, for context
)
```

Live deployment: job ID `60a238f0f942` (2026-06-04, Historical (Hermes era) job ID — re-verify at adoption; not a mini-cron/cron-bb identifier).

## Threshold tuning

- **80%** is the default alert threshold. Comfortable headroom for routine additions.
- **95%** is the emergency threshold. If you set a 95% threshold, expect cleanup to be a P0 each time it fires.
- **Two-tier option:** use a separate daily cron at 80% (advisory) and a weekly at 95% (P0). Avoids alert fatigue.

## Avoid these patterns

- **LLM-driven monitoring for a deterministic check.** Every minute burn = tokens for nothing.
- **Cron that always prints "all clear".** That defeats the silent pattern. Operators will mute the channel.
- **`bc` or `jq` dependency.** May not be in containerized hosts. Use bash integer arithmetic and grep/sed/awk instead.
- **Hard-coded paths to operator's home.** Keep script paths portable and derive storage locations from the environment instead. (Historical (Hermes era): use `~/.hermes/scripts/` conventions so the script works across hosts.)
- **Cron that always exits 0 on no-alert but prints "all clear".** No — print nothing. Empty stdout is the contract.

## When the cron fires

When the alert lands in the thread (Historical (Hermes era): ASTRAL's lane = thread 856; re-verify the current bb thread at adoption), the agent should:

1. Read the alert (which file is over, current size, %)
2. If >95%, run `references/t0-emergency-cleanup-procedure.md` immediately
3. If 80-95%, schedule cleanup in the next maintenance window
4. Update the trend (if the cron has been firing regularly, the threshold may need to be lowered or cleanup cadence increased)

## Related references

- `references/t0-emergency-cleanup-procedure.md` — the cleanup procedure triggered by this watchdog
- `references/memory-hygiene-sop.md` — overall hygiene cadence (this watchdog is one piece)
- the watchdog script directory on the current stack (Historical (Hermes era): `~/.hermes/scripts/`)
