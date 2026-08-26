# 06: Tiered approvals with inline buttons (Telegram)

**What to build:** Scenario ② — safe remote action from the phone. Read-only actions run free; writes, shell-exec, and irreversible actions pause and render an [Approve]/[Deny] inline keyboard in Telegram. Deny aborts cleanly with feedback; approve resumes exactly where it paused. Sender allowlist enforced.

**Blocked by:** 04, 05.

**Status:** ready-for-agent

- [ ] Read-only flow shows no approval prompt end-to-end
- [ ] Write/exec flow pauses with buttons; deny aborts; approve completes
- [ ] Non-allowlisted sender gets nothing
- [ ] Approval state survives an agent turn boundary
