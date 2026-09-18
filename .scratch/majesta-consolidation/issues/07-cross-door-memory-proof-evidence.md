# MAJ-23 / CONS-07 — Evidence: One Being Across Doors

**Date:** 2026-09-18/19 (all timestamps UTC) · **Writer thread:** bb `thr_enjjckb3ch` (worktree env_583dwuwzpr, project "MAJESTA as A Service" proj_5wpwzei7ci)
**Scope honored:** no git repo changes, no settings.json/models.json changes, no infra changes, no Telegram messages sent. Read-only access to bridge/config files; one memory write via the sanctioned propose→approve loop.

## Topology under proof

- **Door ① (bb native):** bb thread → pi (default agent profile) → extension `/opt/data/.pi/extensions/mnemosyne-mcp.js` → MCP read server `127.0.0.1:8645` / write server `127.0.0.1:8646`.
- **Door ② (Telegram):** Telegram → `beye-bridge.py` → spawns `pi` with profile **paci-x** → same extension set (paci-x `settings.json` lines 5–8 include `/opt/data/.pi/extensions/mnemosyne-mcp.js`) → same MCP servers.
- **Shared bank (post-consolidation):** `paci-x`, profile-scoped at `/home/research/vava/hermes-data/.hermes/profiles/paci-x/mnemosyne/data/banks/paci-x/mnemosyne.db`.

---

## Direction A — Telegram → bb

**Claim:** the bank the Telegram bridge holds is the same bank recalled from the bb door.

### A1. Bridge bank pin (config quotes)

`/opt/data/paci-x-repo/scripts/cutover/mnemosyne-sleep-cron.sh` line 14:

```bash
OUT=$(MNEMOSYNE_BANK=paci-x "$CUTOVER_DIR/mnemosyne-sleep-standalone.sh" 2>&1) || RC=$?
```

`/opt/data/paci-x-repo/scripts/cutover/mnemosyne-sleep-standalone.sh` lines 32–33 + 38, 55–58:

```bash
# LIVE paci-x bank is PROFILE-SCOPED (used by MCP :8645/:8646; profile_isolation=true).
# The standalone-root bank (mnemosyne/data/banks/paci-x) is STALE — do not use for live runs.
...
BANK="${MNEMOSYNE_BANK:-paci-x}"
...
  MNEMOSYNE_BANK="$BANK" \
  MNEMOSYNE_DATA_DIR="$DATA_DIR" \
```

with `LIVE_DATA_DIR="/home/research/vava/hermes-data/.hermes/profiles/paci-x/mnemosyne/data"` (line 34).

`/opt/data/cutover-bridge/beye-bridge.py` (identical byte-for-byte to `/opt/data/paci-x-repo/scripts/cutover/beye-bridge.py`, verified `diff -q`): line 76 `PI_AGENT_DIR = os.environ.get("PI_AGENT_DIR", "/home/hermes/.pi/profiles/paci-x")`; bridge.env (`/opt/data/cutover-bridge/bridge.env`) sets `PI_AGENT_DIR=/home/hermes/.pi/profiles/paci-x` (token values not quoted here — credentials). So every Telegram message runs pi in the paci-x profile.

paci-x profile `settings.json` lines 5–8:

```json
"extensions": [
  "/opt/data/.pi/extensions/mnemosyne-mcp.js",
  ...
```

The MCP servers hard-pin the bank DB path — `/home/research/vava/hermes-data/.hermes/scripts/mcp_mnemosyne_server.py` line 32 and `mcp_mnemosyne_write_server.py` lines 41–46:

```python
DB_PATH = "/home/research/vava/hermes-data/.hermes/profiles/paci-x/mnemosyne/data/banks/paci-x/mnemosyne.db"
```

### A2. Recall from bb door of a bridge-era entry

`mnemosyne_recall("CONS-02 evidence")` from bb thread `thr_enjjckb3ch`:

```json
{"id":"26b89a8bda322e0c","content":"CONS-02 evidence: 2026-09-18 — round-trip proof from bb thread thr_cb8gybcsbw (MAJESTA task MAJ-18). ... Active bank for the bb profile: paci-x (profile-scoped at /home/research/vava/hermes-data/.hermes/profiles/paci-x/mnemosyne/data/banks/paci-x). ...","importance":0.7,"source":"cursor","bank":"working","created_at":"2026-09-18 17:51:56"}
```

This is the exact memory created by MAJ-18 (proposal #77 → approved as memory `26b89a8bda322e0c`), present in staging as proposal #77, status `approved`.

### A3. File-path identity (not assumption)

Read-only direct query of the bank DB at the pinned path:

```
TABLE=working_memory id=26b89a8bda322e0c source=cursor created_at=2026-09-18 17:51:56
content head: CONS-02 evidence: 2026-09-18 — round-trip proof from bb thread thr_cb8gybcsbw ...
```

**Conclusion A:** the memory recalled through door ① physically lives in `/home/research/vava/hermes-data/.hermes/profiles/paci-x/mnemosyne/data/banks/paci-x/mnemosyne.db` (table `working_memory`) — the same file pinned by `MNEMOSYNE_BANK=paci-x` + `LIVE_DATA_DIR` on the bridge/cron side and by the MCP servers the bridge-spawned pi sessions use. Same bank, same file.

---

## Direction B — bb → Telegram

**Claim:** a memory written from the bb thread lands in the bank the Telegram door reads. (What cannot be proven without the owner is the final recall-through-a-Telegram-turn; see B4.)

### B1. Propose from bb thread

`mnemosyne_propose` from `thr_enjjckb3ch`:

```json
{"proposal_id":80,"status":"pending","note":"staged for operator approval; NOT yet stored in memory."}
```

Content: `MAJ-23 cross-door marker: written from bb thread thr_enjjckb3ch (bb door ①, native mnemosyne MCP extension at /opt/data/.pi/extensions/mnemosyne-mcp.js, write server 127.0.0.1:8646), intended recall from Telegram door ② (beye-bridge.py → pi profile paci-x). ...` (importance 0.8; tags: MAJ-23, CONS-07, cross-door, bb-to-telegram, marker).

### B2. Operator approve (sanctioned write path)

```
$ mnemosyne_approve.py show 80        → id 80, status pending, source cursor
$ mnemosyne_approve.py approve 80 "MAJ-23 CONS-07 cross-door marker — approved per task brief (bb thread thr_enjjckb3ch)"
APPROVED #80 -> memory_id=8f44201268d622e8
```

The approver (`/opt/data/paci-x-repo/scripts/cutover/mnemosyne_approve.py`) stages into and commits from `.../banks/paci-x/pending_writes.db` (`MNEMOSYNE_HOME = ".../profiles/paci-x"`), always via the official `MnemosyneMemoryProvider` (no raw SQL).

### B3. Marker present in the bridge-read bank

Recall from bb door:

```json
{"id":"8f44201268d622e8","content":"MAJ-23 cross-door marker: written from bb thread thr_enjjckb3ch ...","importance":0.8,"source":"cursor","bank":"working","created_at":"2026-09-18 20:06:08"}
```

Read-only direct DB query at the pinned path:

```
TABLE=working_memory id=8f44201268d622e8 source=cursor created_at=2026-09-18 20:06:08
AUDIT: {'event_id': 61, 'action': 'remember', 'memory_id': '8f44201268d622e8', 'bank': 'private', 'scope': 'global', 'profile': 'paci-x', 'session_id': 'hermes_mnemosyne_approver', 'source_tool': 'mnemosyne_remember'}
```

The audit row independently records `profile: paci-x` and `source_tool: mnemosyne_remember` — the write went through the same provider the bridge-spawned sessions use for durable writes.

### B4. Remaining manual verification (owner-only, 1 message via phone)

From Telegram, send the agent a recall request, e.g. **"recall 'MAJ-23 cross-door marker'"**. Expected: the agent answers with memory `8f44201268d622e8` (importance 0.8, written from bb thread thr_enjjckb3ch). This closes the loop fully at the *behavioral* level (an actual Telegram turn) — the config/file-path level is already proven above. **No Telegram message was sent by this worker.**

---

## Verdict

- **Telegram → bb:** PROVEN at config + file-path level (A1–A3).
- **bb → Telegram:** PROVEN at write/file-path level (B1–B3); final behavioral recall via a Telegram turn is offered to the owner as a 1-message manual check (B4).
- Round-trip uses only the post-consolidation paci-x bank — no legacy-bank borrowing (the stale standalone-root bank is explicitly refused by the fail-closed pin in `mnemosyne-sleep-standalone.sh` lines 38–48).
