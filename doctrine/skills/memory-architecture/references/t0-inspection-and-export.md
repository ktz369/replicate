# T0 Inspection & Export

Historical (Hermes era): this procedure inspected and exported the Hermes-era T0 files (`USER.md`, `MEMORY.md`) under the active profile's `HERMES_HOME` (`~/.hermes/memories/`). On the pi/bb stack, the T0-equivalent content lives in Mnemosyne working memory (inspect via `mnemosyne_recall`; the Mnemosyne SQLite file lives under the pi profile) and injected context files. The archive/export pattern below remains valid for any profile file set — point `base` at the current target directory and re-verify at adoption.

## Physical Storage

On-disk location (Historical (Hermes era), under active profile's HERMES_HOME): `~/.hermes/memories/`. Current-stack equivalents: Mnemosyne SQLite (via `mnemosyne_recall`/`mnemosyne_stats`) + pi profile context files under `~/.pi/agent/`.

| File | Purpose | Safe to Zip? |
|------|---------|-------------|
| `USER.md` | User profile — preferences, identity, style notes | Yes |
| `MEMORY.md` | Agent's operational notes — env facts, project conventions | Yes |
| `USER.md.lock` | Runtime lock file | Optional / usually skip |
| `MEMORY.md.lock` | Runtime lock file | Optional / usually skip |

**T0 total size:** ~2KB typical. Cap: ~2,200 chars (agent) + ~1,375 chars (user).

Lock files are runtime artifacts. Include them only if the user wants a raw dump; skip them for a clean content export.

## Export Pattern

### Preferred: Python `zipfile` (no CLI dependency)

```bash
python3 -c "
import zipfile, os, time
base = '/home/research/vava/hermes-data/.hermes'  # Historical (Hermes era) HERMES_HOME — re-point at the current target dir and re-verify at adoption
out = os.path.join(base, 'media_cache', f't0-memories-{time.strftime("%Y%m%d-%H%M%S")}.zip')  # media_cache: Historical (Hermes era) output dir — re-point at adoption
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(os.path.join(base, 'memories')):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, base)
            zf.write(full, arc)
print(out)
"
```

Why this is the default:
- stdlib only — no package install
- avoids approval-gated `apt-get install zip`
- produces the exact `.zip` format the user asked for
- easy to place directly in a cache/output dir for later delivery (Historical (Hermes era): `media_cache/` + `MEDIA:` attachment delivery; current stack: deliver via the bridge notification path, e.g. `tg-notify.sh`, or attach through the bb environment)

## Pitfalls

- `zip` CLI may not exist on the host. Do **not** assume it.
- If `zip` is missing, do **not** escalate to `apt-get install zip` just to satisfy a packaging request. Use Python `zipfile` instead.
- `tar.gz` is a valid fallback only if the user accepts a different archive format. If they explicitly ask for `.zip`, comply exactly.
- `.lock` files are not meaningful content; treat them as optional noise unless the operator wants a raw filesystem snapshot.
- For messaging-platform delivery, put the output under a writable output/cache directory and send it through the current bridge's notification path (Historical (Hermes era): `~/.hermes/media_cache/` + attach as `MEDIA:/absolute/path/file.zip`; current stack: e.g. `tg-notify.sh`).
