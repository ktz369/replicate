#!/usr/bin/env bash
#
# bootstrap/bootstrap.sh — MAJESTA stack bootstrap (CONS-05 / MAJ-21)
#
# One idempotent script that reconstructs the MAJESTA pi stack in a fresh
# home directory: profile directories, settings.json (extensions + packages),
# doctrine skills, the learning-loop extension, and the Telegram bridge config.
#
# Principles (ticket 05-bootstrap-script.md):
#   - idempotent: run twice; the second run is a no-op report
#   - never clobbers operator data: an existing settings.json is only
#     read-modify-write'd (additions only), identical skills are skipped,
#     existing bridge files (bridge.env may hold live tokens) are never
#     overwritten
#   - installs content only: no npm install, no tokens, no credentials,
#     no process management, no crontab changes (see manual steps at end)
#
# See bootstrap/README.md for the full contract.
#
# Usage:
#   bash bootstrap/bootstrap.sh                       # operate on $HOME
#   HOME=/tmp/testhome bash bootstrap/bootstrap.sh    # operate elsewhere
#
# Environment overrides (testing seams; defaults match the live machine):
#   LIVE_PI_ROOT          default /opt/data/.pi
#   CUTOVER_BRIDGE_DIR    default /opt/data/cutover-bridge
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Repo root: directory containing this script (bootstrap/ is one level below).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Live pi root on this machine (hosts mnemosyne-mcp.js). Override for testing.
LIVE_PI_ROOT="${LIVE_PI_ROOT:-/opt/data/.pi}"

# Bridge directory (live) — override only for testing.
CUTOVER_BRIDGE_DIR="${CUTOVER_BRIDGE_DIR:-/opt/data/cutover-bridge}"

# Repo-hosted inputs.
SETTINGS_TEMPLATE="${REPO_ROOT}/config/profile/settings.template.json"
SKILLS_SRC="${REPO_ROOT}/doctrine/skills"
LEARNING_LOOP_TEMPLATE="${REPO_ROOT}/bootstrap/templates/learning-loop.ts.template"
BRIDGE_DIR_SRC="${REPO_ROOT}/config/bridge"

# Target dirs (relative to the effective HOME). "${HOME:-}" keeps set -u
# from aborting here; the preflight check below reports a missing HOME.
PI_AGENT_DIR="${HOME:-}/.pi/agent"
TARGET_SKILLS="$PI_AGENT_DIR/skills"
TARGET_EXTENSIONS="$PI_AGENT_DIR/extensions"
TARGET_NPM="$PI_AGENT_DIR/npm"
TARGET_SESSIONS="$PI_AGENT_DIR/sessions"
TARGET_SETTINGS="$PI_AGENT_DIR/settings.json"

# Doctrine skills to install (each is a directory containing SKILL.md).
# Order mirrors doctrine/skills/README.md.
SKILL_LIST=(
  memory-architecture
  trinity-memory-placement
  trinity-session-routing
  trinity-verification-gates
  compound
  compound-refresh
)

REQUIRED_PACKAGES=(npm:pi-compound-engineering)
REQUIRED_EXTENSIONS=("$LIVE_PI_ROOT/extensions/mnemosyne-mcp.js")

# ---------------------------------------------------------------------------
# Logging + counters
#   INSTALL — created, or (skills/learning-loop only) overwritten because the
#             existing content differed
#   SKIP    — already present with identical content (or operator file that
#             must never be overwritten)
#   UPDATE  — read-modify-write that only added missing entries, or a
#             secret-free operator-editable file refreshed from the repo
#   WARN    — best-effort step that could not be completed; run still succeeds
# ---------------------------------------------------------------------------

declare -i N_INSTALL=0 N_SKIP=0 N_UPDATE=0 N_WARN=0

log() { printf '%s\n' "$*"; }

tag() {
  # tag ACTION "message" — one line per action, counted for the summary.
  local action="$1"; shift
  log "[$action] $*"
  case "$action" in
    INSTALL) N_INSTALL+=1 ;;
    SKIP)    N_SKIP+=1 ;;
    UPDATE)  N_UPDATE+=1 ;;
    WARN)    N_WARN+=1 ;;
  esac
}

die() { log "[ERROR] $*"; exit 1; }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# files_identical <a> <b> — 0 if both exist and have identical content.
files_identical() {
  [[ -f "$1" && -f "$2" ]] && cmp -s "$1" "$2"
}

# dirs_identical <a> <b> — 0 if both exist and diff -r reports no differences.
dirs_identical() {
  [[ -d "$1" && -d "$2" ]] && diff -r -q "$1" "$2" >/dev/null 2>&1
}

# json_add_missing <file> <key> <value...> — atomically (tmp file + rename)
# append values missing from the array-of-strings at key. Existing entries
# are never removed or reordered (operator data is sacred). Prints each
# appended value prefixed with "+"; prints nothing when already complete.
json_add_missing() {
  local file="$1" key="$2"; shift 2
  python3 - "$file" "$key" "$@" <<'PYEOF'
import json, os, sys, tempfile
path, key, wanted = sys.argv[1], sys.argv[2], sys.argv[3:]
with open(path, encoding="utf-8") as fh:
    data = json.load(fh)
arr = data.get(key)
if not isinstance(arr, list):
    arr = []
    data[key] = arr
known = {e for e in arr if isinstance(e, str)}
added = []
for value in wanted:
    if value not in known:
        arr.append(value)
        added.append(value)
if not added:
    sys.exit(0)
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path) or ".",
                           prefix=".settings.", suffix=".tmp")
try:
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    os.replace(tmp, path)  # atomic on POSIX
except BaseException:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    raise
for value in added:
    print(f"+ {value}")
PYEOF
}

# ensure_settings_entries — make sure settings.json carries the required
# packages and extensions. Additions only; atomic; no removals. Used both
# after installing the template into a fresh home and on an existing file.
ensure_settings_entries() {
  local added
  added="$(json_add_missing "$TARGET_SETTINGS" packages "${REQUIRED_PACKAGES[@]}")"
  if [[ -n "$added" ]]; then
    while IFS= read -r line; do tag UPDATE "packages $line"; done <<< "$added"
  else
    tag SKIP "packages already contain: ${REQUIRED_PACKAGES[*]}"
  fi
  # The mnemosyne extension is always registered, even when its file is
  # missing on this machine (the WARN below covers the missing file).
  added="$(json_add_missing "$TARGET_SETTINGS" extensions "${REQUIRED_EXTENSIONS[@]}")"
  if [[ -n "$added" ]]; then
    while IFS= read -r line; do tag UPDATE "extensions $line"; done <<< "$added"
  else
    tag SKIP "extensions already contain: ${REQUIRED_EXTENSIONS[*]}"
  fi
}

summary() {
  log ""
  log "=== Bootstrap summary ==="
  log "INSTALL: $N_INSTALL  UPDATE: $N_UPDATE  SKIP: $N_SKIP  WARN: $N_WARN"
  if (( N_WARN > 0 )); then
    log "WARNING: $N_WARN step(s) need manual attention — see [WARN] lines above."
  fi
  log ""
  log "=== Manual steps (intentionally NOT automated by this script) ==="
  log "1. npm packages: cd $TARGET_NPM && npm install"
  log "   (package.json has been written with the pi-compound-engineering"
  log "    dependency; the install itself is left to the operator)"
  log "2. Bridge credentials: fill the real values into"
  log "   $CUTOVER_BRIDGE_DIR/bridge.env (TELEGRAM_BOT_TOKEN, home channel,"
  log "   operator UID, provider API keys). Template:"
  log "   $BRIDGE_DIR_SRC/bridge.env.template — never commit real values."
  log "3. Watchdog cron: re-register the Telegram bridge watchdog on this"
  log "   machine (crontab -e). Not done here because cron content is"
  log "   machine- and schedule-specific."
  log "4. Mnemosyne: ensure the mnemosyne MCP servers are running and that"
  log "   tokens are reachable (MNEMOSYNE_TOKEN / MNEMOSYNE_WRITE_TOKEN env"
  log "   vars or the token files the mnemosyne-mcp.js extension reads)."
  log ""
  log "Done."
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

if [[ -z "${HOME:-}" ]]; then
  die "HOME is not set. Run as: HOME=/path/to/fresh/home bash bootstrap/bootstrap.sh"
fi
if [[ ! -f "$SETTINGS_TEMPLATE" ]]; then
  die "settings template missing: $SETTINGS_TEMPLATE (run from the MAJESTA repo)"
fi
if [[ ! -d "$SKILLS_SRC" ]]; then
  die "skills source missing: $SKILLS_SRC (run from the MAJESTA repo)"
fi
if [[ ! -f "$LEARNING_LOOP_TEMPLATE" ]]; then
  die "learning-loop template missing: $LEARNING_LOOP_TEMPLATE"
fi
for skill in "${SKILL_LIST[@]}"; do
  if [[ ! -f "$SKILLS_SRC/$skill/SKILL.md" ]]; then
    die "doctrine skill missing: $SKILLS_SRC/$skill/SKILL.md"
  fi
done
for f in bridge.env.template model-routing.env; do
  if [[ ! -f "$BRIDGE_DIR_SRC/$f" ]]; then
    die "bridge template missing: $BRIDGE_DIR_SRC/$f"
  fi
done
# Runtime dependency of this script itself (atomic settings.json updates).
if ! command -v python3 >/dev/null 2>&1; then
  die "python3 is required for atomic settings.json updates but was not found"
fi

log "MAJESTA bootstrap (CONS-05)"
log "repo:       $REPO_ROOT"
log "target:     $PI_AGENT_DIR"
log "live pi:    $LIVE_PI_ROOT"
log "bridge dir: $CUTOVER_BRIDGE_DIR"
log ""

# ---------------------------------------------------------------------------
# 1. Provision directories
# ---------------------------------------------------------------------------

log "--- 1. Directories ---"
for dir in "$PI_AGENT_DIR" "$TARGET_SKILLS" "$TARGET_EXTENSIONS" "$TARGET_NPM" "$TARGET_SESSIONS"; do
  if [[ -d "$dir" ]]; then
    tag SKIP "dir exists: $dir"
  else
    mkdir -p "$dir"
    tag INSTALL "dir created: $dir"
  fi
done
log ""

# ---------------------------------------------------------------------------
# 2. Profile settings (extensions + packages) — never clobber operator data
# ---------------------------------------------------------------------------

log "--- 2. Settings ---"
if [[ ! -f "$TARGET_SETTINGS" ]]; then
  # Fresh home: no operator data to protect — install the template, then run
  # the same ensure pass so run 1 already yields the complete, idempotent
  # settings surface (the template alone carries no "packages" entry).
  cp "$SETTINGS_TEMPLATE" "$TARGET_SETTINGS"
  tag INSTALL "settings.json installed from template (fresh home)"
else
  tag SKIP "settings.json exists — not overwritten (read-modify-write only)"
fi
ensure_settings_entries

# Install the mnemosyne bridge extension if this machine hosts it.
MNEMOSYNE_SRC="$LIVE_PI_ROOT/extensions/mnemosyne-mcp.js"
MNEMOSYNE_DST="$TARGET_EXTENSIONS/mnemosyne-mcp.js"
if [[ -f "$MNEMOSYNE_SRC" ]]; then
  if files_identical "$MNEMOSYNE_SRC" "$MNEMOSYNE_DST"; then
    tag SKIP "mnemosyne extension already installed: $MNEMOSYNE_DST"
  else
    cp "$MNEMOSYNE_SRC" "$MNEMOSYNE_DST"
    tag INSTALL "mnemosyne extension copied from $MNEMOSYNE_SRC"
  fi
else
  tag WARN "mnemosyne extension not found at $MNEMOSYNE_SRC on this machine"
  tag WARN "manually place mnemosyne-mcp.js at $MNEMOSYNE_DST; the settings.json"
  tag WARN "extension entry already points there."
fi
log ""

# ---------------------------------------------------------------------------
# 3. Doctrine skills — copy-first; identical content is skipped
# ---------------------------------------------------------------------------

log "--- 3. Skills ---"
for skill in "${SKILL_LIST[@]}"; do
  src="$SKILLS_SRC/$skill"
  dst="$TARGET_SKILLS/$skill"
  if [[ ! -d "$dst" ]]; then
    cp -a "$src" "$dst"
    tag INSTALL "skill installed: $skill"
  elif dirs_identical "$src" "$dst"; then
    tag SKIP "skill identical: $skill"
  else
    rm -rf "$dst"
    cp -a "$src" "$dst"
    tag INSTALL "skill overwritten (content differed): $skill"
  fi
done
log ""

# ---------------------------------------------------------------------------
# 4. Learning-loop extension — PROFILE_DIR patched to the target profile
# ---------------------------------------------------------------------------

log "--- 4. Learning loop ---"
LEARNING_LOOP_DST="$TARGET_EXTENSIONS/learning-loop.ts"
# The live learning-loop hardcodes its PROFILE_DIR; the repo template carries
# a __PROFILE_DIR__ placeholder instead, substituted with the target profile
# at copy time.
render_learning_loop() {
  sed "s|__PROFILE_DIR__|$PI_AGENT_DIR|g" "$LEARNING_LOOP_TEMPLATE"
}
if [[ -f "$LEARNING_LOOP_DST" ]]; then
  render_learning_loop > "$LEARNING_LOOP_DST.tmp"
  if files_identical "$LEARNING_LOOP_DST.tmp" "$LEARNING_LOOP_DST"; then
    rm -f "$LEARNING_LOOP_DST.tmp"
    tag SKIP "learning-loop identical (PROFILE_DIR=$PI_AGENT_DIR)"
  else
    mv "$LEARNING_LOOP_DST.tmp" "$LEARNING_LOOP_DST"
    tag INSTALL "learning-loop overwritten (content differed)"
  fi
else
  render_learning_loop > "$LEARNING_LOOP_DST.tmp"
  mv "$LEARNING_LOOP_DST.tmp" "$LEARNING_LOOP_DST"
  tag INSTALL "learning-loop installed (PROFILE_DIR=$PI_AGENT_DIR)"
fi
# Review dir: drafts land here; creating it up front matches the live stack.
if [[ -d "$PI_AGENT_DIR/skills-review" ]]; then
  tag SKIP "review dir exists: $PI_AGENT_DIR/skills-review"
else
  mkdir -p "$PI_AGENT_DIR/skills-review"
  tag INSTALL "review dir created: $PI_AGENT_DIR/skills-review"
fi
log ""

# ---------------------------------------------------------------------------
# 5. Bridge config — copy-if-absent only (live bridge.env may hold tokens)
# ---------------------------------------------------------------------------

log "--- 5. Bridge ---"
if [[ -d "$CUTOVER_BRIDGE_DIR" ]]; then
  for f in bridge.env.template model-routing.env; do
    src="$BRIDGE_DIR_SRC/$f"
    dst="$CUTOVER_BRIDGE_DIR/$f"
    if [[ ! -f "$dst" ]]; then
      cp "$src" "$dst"
      tag INSTALL "bridge file installed: $dst"
    elif files_identical "$src" "$dst"; then
      tag SKIP "bridge file identical: $dst"
    elif [[ "$f" == "bridge.env.template" ]]; then
      # Same protection as live bridge.env: operator-owned, never overwritten.
      tag SKIP "bridge file exists — not overwritten: $dst"
    else
      # model-routing.env holds no secrets; refresh operator-editable routing.
      cp "$src" "$dst"
      tag UPDATE "bridge file updated (no secrets): $dst"
    fi
  done
  # bridge.env itself: ONLY from template, ONLY if absent (the live file may
  # hold real tokens — it is never read, copied over, or removed).
  if [[ -f "$CUTOVER_BRIDGE_DIR/bridge.env" ]]; then
    tag SKIP "bridge.env exists — live credentials never touched: $CUTOVER_BRIDGE_DIR/bridge.env"
  else
    cp "$BRIDGE_DIR_SRC/bridge.env.template" "$CUTOVER_BRIDGE_DIR/bridge.env"
    tag INSTALL "bridge.env from template (placeholders — fill credentials manually)"
  fi
else
  tag WARN "bridge dir not found: $CUTOVER_BRIDGE_DIR — bridge wiring skipped"
  tag WARN "create it (or set CUTOVER_BRIDGE_DIR) and re-run to wire the bridge."
fi
log ""

# ---------------------------------------------------------------------------
# Summary + manual steps
# ---------------------------------------------------------------------------

summary
