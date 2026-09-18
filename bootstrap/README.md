# bootstrap/ — reconstruct the MAJESTA stack on a fresh home

`bootstrap.sh` is the one idempotent script (CONS-05 / MAJ-21) that rebuilds
the MAJESTA pi stack in a fresh home directory from what this repo hosts:
profile directories, profile settings (extensions + packages), the doctrine
skills, the learning-loop extension, and the Telegram bridge config.

Design spec: `.scratch/majesta-consolidation/spec.md` (Implementation
Decisions → "Bootstrap defines done") and
`.scratch/majesta-consolidation/issues/05-bootstrap-script.md`.

## Usage

```bash
bash bootstrap/bootstrap.sh                      # operate on $HOME
HOME=/tmp/testhome bash bootstrap/bootstrap.sh   # operate on another home
```

Environment overrides (testing seams; defaults match the live machine):

| Variable              | Default                     |
|-----------------------|-----------------------------|
| `LIVE_PI_ROOT`        | `/opt/data/.pi`             |
| `CUTOVER_BRIDGE_DIR`  | `/opt/data/cutover-bridge`  |

Requirements: `bash`, `python3` (for atomic settings.json updates),
GNU `diff`/`cmp` (present on any normal Linux box).

## What it does, per step

1. **Directories** — creates `~/.pi/agent/{skills,extensions,npm}`,
   `~/.pi/agent/sessions` (plus `skills-review/`, which the learning-loop
   writes to). Existing dirs are skipped.

2. **Settings** — `~/.pi/agent/settings.json`:
   - Missing → installed from `config/profile/settings.template.json`, then
     the ensure pass below runs on the copy, so run 1 already yields the
     complete surface.
   - Present → **never overwritten**. A read-modify-write (Python, atomic
     tmp file + rename, additions only) makes sure `packages` contains
     `npm:pi-compound-engineering` and `extensions` contains the mnemosyne
     extension path. Existing entries are never removed or reordered.
   - The mnemosyne extension file (`$LIVE_PI_ROOT/extensions/mnemosyne-mcp.js`)
     is copied into the profile **only if the source exists**; if it doesn't,
     the script emits a clear `[WARN]` with manual instructions and still
     exits 0.

3. **Skills** — the 6 doctrine skills from `doctrine/skills/`
   (memory-architecture, trinity-memory-placement, trinity-session-routing,
   trinity-verification-gates, compound, compound-refresh) are copied into
   `~/.pi/agent/skills/`. Identical content → `[SKIP]`; differing content →
   overwritten and recorded as `[INSTALL] … (content differed)`.

4. **Learning loop** — `bootstrap/templates/learning-loop.ts.template`
   (the live extension with its hardcoded `PROFILE_DIR` replaced by a
   `__PROFILE_DIR__` placeholder) is rendered with the target profile dir
   and installed to `~/.pi/agent/extensions/learning-loop.ts`.

5. **Bridge** — if `$CUTOVER_BRIDGE_DIR` exists:
   `bridge.env.template` and `model-routing.env` are copied from
   `config/bridge/` **only if absent**; `bridge.env` itself is created from
   the template **only if absent**. An existing `bridge.env` (live tokens!)
   or `bridge.env.template` is never read, overwritten, or removed.
   `model-routing.env` may be updated in place — it contains no secrets.
   If the bridge dir doesn't exist, the step emits `[WARN]` and the script
   still exits 0 (a fresh box may not have it yet).

## What it deliberately does NOT do

- no `npm install` (the `npm/package.json` is written; running the install
  is a manual step, printed at the end)
- no tokens / credentials — never reads or writes secret values; bridge.env
  is only ever created from the placeholder template
- no kill/start of processes
- no crontab / watchdog registration (instructions printed at the end)

## Idempotency contract

Run 2 after run 1 must report only `[SKIP]` (plus `[UPDATE]` only when the
live stack genuinely differs, e.g. a refreshed `model-routing.env`).
The second-run report is the acceptance proof; see the MAJ-21 bb task
comment for the recorded run-1 / run-2 / tree evidence.

`--help` is not implemented; the header comment and this README are the
documentation of record.
