# Skill Name Collision Detection

A skill name collision is a **silent dispatch killer**. If a skill name exists as both a standalone skill and a reference file (or skill directory) inside another skill, the skill loader raises `Ambiguous skill name` and refuses to load the skill (Historical (Hermes era): the Hermes loader behaved this way; verify the pi loader's exact behavior at adoption — the defensive rule applies regardless of loader). Since most agent configs reference the canonical 7-skill trinity bundle, **all dispatches silently fail**.

Owner: ASTRAL. Detection procedure documented from a real incident on 2026-06-03.

## Symptom

- Agent receives message but never dispatches a response
- No error in gateway logs at the dispatch level
- `hermes chat -q "test"` with the affected skill hangs or returns generic mode (Historical (Hermes era) dispatch test; current stack: run a pi session and check which skill loads)

## Root Cause

The collision pattern looks like this:

```
/home/.../skills/devops/
├── trinity-mode-default/          ← the skill
│   └── references/
│       └── trinity-mode-operating-anchor-pattern.md  ← also matches "trinity-mode-operating-anchor"
└── trinity-mode-operating-anchor/  ← the skill
    └── SKILL.md
```

The loader can't tell whether `trinity-mode-operating-anchor` refers to the skill or to a reference file inside another skill (Historical (Hermes era): observed on the Hermes loader).

## Detection Procedure

Run a quick scan from the skills directory:

```bash
cd ~/.pi/agent/skills   # Historical (Hermes era): cd ~/.hermes/skills
for skill in $(find . -name "SKILL.md" -exec dirname {} \;); do
  skill_name=$(basename "$skill")
  # Look for files inside OTHER skills that match this skill's name
  matches=$(find . -path "*/references/*${skill_name}*" -o -path "*/templates/*${skill_name}*")
  if [ -n "$matches" ]; then
    echo "COLLISION: $skill_name"
    echo "  Files: $matches"
  fi
done
```

Alternatively, use the per-skill dispatch test (Historical (Hermes era): from `skill-lifecycle-ops`; current stack: load the skill in a pi session and confirm which skill dispatches):

```bash
hermes chat -q "test" -s <skill-name>  # Historical (Hermes era) command — should not return "Ambiguous skill name"
```

## Fix Pattern

If a reference file inside skill A has the same name as skill B (a standalone skill), rename the reference file:

```bash
# Old (collision)
mv skills/devops/trinity-mode-default/references/trinity-mode-operating-anchor-pattern.md \
   skills/devops/trinity-mode-default/references/trinity-operating-anchor-pattern.md

# New (no collision)
```

Then update the reference in the parent skill's SKILL.md:

```yaml
related_skills: [trinity-mode-default, trinity-mode-operating-anchor, ...]
```

The reference path inside the doc body also needs updating. Search for any mention of the old name and replace.

## Prevention

When adding a new reference file inside a skill, **never name the file with a hyphen-separated string that matches an existing skill's name**. Append a suffix like `-pattern`, `-example`, `-guide`, `-reference`, `-notes` to disambiguate.

Bad:
- `trinity-mode-default/references/trinity-mode-operating-anchor.md`  ← collides with skill `trinity-mode-operating-anchor`

Good:
- `trinity-mode-default/references/trinity-operating-anchor-pattern.md`  ← unique

## Pre-Deployment Checklist

Before deploying any new skill or reference file:

- [ ] Run the detection scan above
- [ ] Verify each reference file has a unique name relative to all standalone skills
- [ ] If a collision is found, rename the reference file with a disambiguating suffix
- [ ] Update the parent skill's `related_skills` to point to the actual skill, not the reference file
- [ ] Run the dispatch test for each affected skill to confirm dispatch works (Historical (Hermes era): `hermes chat -q "test" -s <skill-name>`; current stack: load the skill in a pi session)
