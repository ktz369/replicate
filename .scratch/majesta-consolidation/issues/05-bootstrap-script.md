# 05: Bootstrap script — reconstruct the stack on a fresh VPS

**What to build:** One idempotent script that, run in a fresh home, provisions directories, installs profile settings (extensions, packages, skills), wires the Telegram bridge env from templates, and registers the watchdog crons — reconstructing the live stack's shape. Verified by running it against a temp home and spawning pi from the result with the expected surface (the script's output is the proof, not documentation).

**Blocked by:** 04 (repo-of-record) — it installs what the repo hosts.

**Status:** draft-for-review (flip to ready-for-agent after owner approval)

- [ ] Fresh-home run produces a working pi profile (memory + skills reachable)
- [ ] Bridge env + watchdog crons registrable from templates
- [ ] Re-run is a no-op (idempotent), no credentials embedded
- [ ] Run log + resulting tree recorded as ticket evidence
