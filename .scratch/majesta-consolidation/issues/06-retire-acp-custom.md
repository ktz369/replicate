# 06: Retire ACP-custom doors (Beye paci-x bridge + watchdog)

**What to build:** The redundant custom-ACP path is decommissioned by subtraction: the bb `customAcpAgents` entries (beye + hermes) are removed, the custom bridge script is archived, its dedicated watchdog cron is removed from crontab, and the accumulated bridge session files are archived (not deleted). After this, each surface has exactly one spawn path: bb threads via native pi-acp, Telegram via beye-bridge.py. Verified by confirming Telegram still works normally after removal and no process/cron references the retired door.

**Blocked by:** 01 (adopt-skill-assets) + 02 (wire-mnemosyne) — the capabilities owner used the custom door for must already live in the bb profile, so nothing is lost at removal.

**Status:** draft-for-review (flip to ready-for-agent after owner approval)

- [ ] customAcpAgents entries (beye, hermes) removed from bb config
- [ ] Custom bridge script archived; watchdog cron line removed; cron reloaded
- [ ] No running process or cron references the retired door
- [ ] Telegram companion verified working post-removal (evidence logged)
- [ ] pi-bridge-sessions archived (no deletion of history)
