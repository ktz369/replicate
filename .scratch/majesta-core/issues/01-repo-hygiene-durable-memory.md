# 01: Repo hygiene & durable session memory

**What to build:** A fresh clone of the repo behaves like the owner's machine: the pi skills MAJESTA depends on are tracked in git, and the Mnemosyne memory backend lives in a repo-level virtualenv (gitignored) so captured learnings survive reboots instead of dying with a `/tmp` venv.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `.pi/skills/` is committed; a fresh clone exposes all skills to the pi runtime
- [ ] Repo-level venv exists with `mnemosyne-memory` installed; it is gitignored
- [ ] One-line setup note documents how to recreate the venv
- [ ] Evidence shown: skill files tracked, `pip list` output from the new venv
