# T0 Emergency Cleanup Procedure

Use when T0 (hot memory) crosses **80% of its limit** (≥1,760/2,200 chars agent OR ≥1,100/1,375 chars user profile) and the agent is showing context-window pressure.

Owner: ASTRAL. Director: Luce.

## When to Trigger

- T0 usage > 80% (visible in memory block header: `[XX% — N/limit chars]`)
- Tool outputs competing with reasoning for context space
- User reports "model forgets things mid-session"

## Procedure

### Step 1 — Backup current T0 state
Write the full T0 contents to a timestamped file under `docs/handoff/t0-snapshots/`.

The memory tool has no read-only list action — to inspect T0 you must trigger a write that returns the current entry list (Historical (Hermes era): the Hermes `memory` tool behaved this way; on the pi stack use `mnemosyne_recall` to read working/episodic banks before resorting to write-then-read tricks). The placeholder trick below is kept as the historical pattern:

```
mkdir -p docs/handoff/t0-snapshots
TS=$(date +%Y-%m-%d-%H%M%S)
# Inspect MEMORY.md (returns full entry list in response)
memory(action='add', target='memory', content='__BACKUP_$TS__')          # Historical (Hermes era) tool calls
# Read the entry list, then immediately remove placeholder
memory(action='remove', target='memory', old_text='__BACKUP_$TS__')      # Historical (Hermes era)
# Repeat for USER.md
memory(action='add', target='user', content='__BACKUP_USER_$TS__')       # Historical (Hermes era)
memory(action='remove', target='user', old_text='__BACKUP_USER_$TS__')   # Historical (Hermes era)
```

Then write the captured entry list to disk:

```
# Manually write what you saw in the response above
cat > docs/handoff/t0-snapshots/$TS-pre-cleanup-memory.txt <<'EOF'
=== MEMORY.md (X% — N/2,200 chars) ===
1. <entry 1>
2. <entry 2>
...
=== USER.md (Y% — M/1,375 chars) ===
1. <entry 1>
...
EOF
```

**Caveat:** the add+remove cycle itself is a write — and at >90% capacity, T0 write instability is real (silent corruption observed 2026-06-04). The first add+remove is unavoidable, but minimize other writes until you're under 90%.

### Step 2 — Audit every entry
For each entry, classify as one of:
- **KEEP** — compact directive, stable preference, routing rule, short pointer
- **COMPRESS** — entry is valid but verbose, can be reduced via pointer pattern or terse encoding
- **MIGRATE** — content is procedure or doctrine that belongs in T2 (skill) or T3 (doc)
- **DELETE** — stale data, task progress, lookup instructions, duplicates already in T2/T3, **T0-internal duplicates (two entries saying the same thing — do a full-list scan, not just per-entry)**

### Step 3 — Execute in priority order

1. **DELETE** all stale/task-progress entries first. Most T0 shrinkage comes from deletions, not compressions.
2. **MIGRATE** procedure to T2 (skills) using the skill-creation path (Historical (Hermes era): `skill_manage(action='create', ...)`; current stack: create the skill directory + SKILL.md under the profile's skills/ and verify it loads).
3. **COMPRESS** remaining entries using:
   - **Pointer pattern**: replace long explanations with `see <skill-name>` or `see <doc-path>`
   - **Terse encoding**: `User prefers X. Also Y.` → `X, Y`
4. **KEEP** only compact directives, stable preferences, and short pointers.

### Step 4 — Verify
- T0 usage should be ≤55% (≤1,210/2,200 chars)
- Run before/after comparison
- Spot-check that no critical directive was lost
- **Re-read T0 after every change** during cleanup — at >90% capacity, the memory tool can silently revert unrelated entries to stale values (Historical (Hermes era) behavior; current stack: re-read via `mnemosyne_recall` after every write). After each add/remove/replace, check the returned list for unexpected changes (especially thread IDs, agent mappings, T4-sensitive facts).
- Write a post-cleanup snapshot to `docs/handoff/t0-snapshots/$TS-post-cleanup-memory.txt` with the final state for diff/audit.

### Step 5 — Report
Post to the owner's lane with (Historical (Hermes era): thread 856, ASTRAL's lane — re-verify the current bb thread at adoption):
- before/after metrics (chars, % used, entry count)
- list of deleted entries with one-line reason
- list of migrated entries with destination (skill path or doc path)
- confirmation that target was met

## Anti-Patterns to Avoid

- Don't compress before deleting — deletions are higher impact and lower risk
- Don't keep "just in case" entries — if it's not a directive, pointer, or stable pref, it doesn't belong
- Don't migrate to T3 if the content is procedure — T2 (skills) is for SOPs
- Don't promote recall into a new T0 entry — recall belongs in T1
- Don't write a T2 skill just to free up T0 — only migrate if the procedure is genuinely reusable across sessions

## Worked Example: ASTRAL's 2026-06-07 Phase 2

- **Before**: 2,083/2,200 (94%) memory + 1,342/1,375 (97%) user
- **Deleted**: 2 entries (bulk-mv pitfall, duplicate user preference)
- **Compressed**: 7 entries (pointer pattern for handoff/memory-arch/Hub specs + terse encoding for doctrine rules)
- **After**: 886/2,200 (40%) memory + 723/1,375 (52%) user
- **Result**: 50 percentage points freed; target of 55% exceeded (combined ~12% margin)
- **Key lesson**: The USER.md had a duplicate entry (both said "short answers default") — always scan the full entry list for duplicates before classifying.
- **Backup method used**: placeholder add/remove trick (no `hermes memory dump` CLI existed — Historical (Hermes era))

## Worked Example: ASTRAL's 2026-06-04 Phase 1

- **Before**: 2,117/2,200 (96%) memory + 1,264/1,375 (91%) user
- **Deleted**: 4 entries (Phase 8 commit, snapshot path, skill_view lookup, HCR soak procedure)
- **Compressed**: 13 entries (pointer pattern + terse encoding)
- **After**: 755/2,200 (34%) memory + 620/1,375 (45%) user
- **Result**: 56 percentage points freed; target of 55% exceeded (38.5% combined)
