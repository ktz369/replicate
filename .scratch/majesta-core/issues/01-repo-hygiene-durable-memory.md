# 01: Repo hygiene & durable session memory

**What to build:** A fresh clone of the repo behaves like the owner's machine: the pi skills MAJESTA depends on are tracked in git, and the Mnemosyne memory backend lives in a durable location so captured learnings survive reboots.

**Blocked by:** None (can start immediately).

**Status:** closed

- [x] `.pi/skills/` is committed; a fresh clone exposes all skills to the pi runtime
- [x] Repo-level venv exists with `mnemosyne-memory` installed; it is gitignored
- [x] One-line setup note documents how to recreate the venv (README "Session memory" section)
- [x] Evidence shown: skill files tracked, `pip list` output from the new venv

## Comments

**2026-08-26 — executed.** Findings corrected the handoff premise:

- The Mnemosyne *server* was already durable, not ephemeral: live process PID 2562 serving `127.0.0.1:8645` from `/home/research/vava/hermes-data/.hermes/venvs/mcp/bin/python .../scripts/mcp_mnemosyne_server.py` (verified via `/proc` socket match on port hex `21C5` + HTTP 401 auth-gated response). The `/tmp/oxagent-venv` ephemerality applied only to CLI tooling.
- Created repo-level `.venv/` (gitignored) with `mnemosyne-memory 3.15.1` — durable CLI for backup/import/export/verify. Note: `mnemosyne-install` is a Hermes-specific installer, irrelevant to pi.
- README gained a "Session memory (Mnemosyne)" section documenting venv recreation.
- Commits: `d440fcd` (skills + venv + gitignore + README), pushed to origin.

Evidence:
```
$ .venv/bin/pip list | grep -i mnemosyne
mnemosyne-memory 3.15.1
$ git log --oneline -1
d440fcd Track pi skills; repo-level Mnemosyne venv (ticket MAJ-1 / 01)
```
