# Memory Hygiene SOP

Ongoing cadence for keeping T0–T4 layers clean after the initial emergency cleanup.

Owner: ASTRAL. Director: Luce.

## Cadence

| Activity | Frequency | Trigger |
|----------|-----------|---------|
| T0 size check | weekly (watchdog job) | T0 > 80% → alert + auto-cleanup |
| T2 skill audit | monthly | new skill added, or agent skill count drift |
| T3 doc review | quarterly | last review > 90 days |
| T1 recall discipline | per-session (operator habit) | agent uses T1 as authority |
| T4 observability | continuous (Phase 4 work) | T4 conflict detected |

## T0 Monitoring (Phase 4 target)

Historical (Hermes era) pseudo-spec used `hermes memory check` (a Hermes CLI capability that does not exist on the pi stack). Current-stack equivalent: a mini-cron watchdog (crontab file under `scripts/cutover`) or cron bb job running a size/threshold check over the T0-equivalent storage (Mnemosyne working bank / injected context), alerting through the bridge notification path:

```
<watchdog script> --target memory --threshold 80 --action alert    # T0-equivalent check
<watchdog script> --target user  --threshold 80 --action alert
```

- Sends alert to the owner's lane when T0 > 80% (Historical (Hermes era): thread 856 — re-verify the current bb thread at adoption)
- Runs weekly by default; can be tightened to daily if drift is fast

## T2 Skill Audit Checklist

Run for each agent on monthly cadence:

- [ ] Agent's TOML `skills` list matches the canonical baseline + declared overlays
- [ ] No skill has SKILL.md > 400 lines without `references/` directory
- [ ] No trinity-* skill exists outside the canonical 7
- [ ] No two skills cover the same trigger condition (collision check)
- [ ] Each skill carries its provenance/related-skills metadata (Historical (Hermes era): a `metadata.hermes.related_skills` entry; current stack: the `metadata.provenance` block or equivalent)
- [ ] Skill name has no collision with files inside other skills (e.g., `trinity-mode-operating-anchor` exists as both skill and reference file)

## T3 Doc Review Checklist

Run quarterly per doc:

- [ ] Doc is still referenced in at least one T2 skill or T1 session
- [ ] Doc's stated facts match T4 (no stale claims masquerading as live truth)
- [ ] Doc has a `last_reviewed: YYYY-MM-DD` footer
- [ ] Doc's "Next step" is either done or escalated
- [ ] Doc is not duplicating content from another T3 doc

Archive (move to `docs/archive/YYYY-QN/`) if any check fails twice in a row.

## T1 Recall Discipline (operator habit)

When answering a question, before reaching for T1 (session search):

1. Can T4 answer this? (current runtime state)
2. Is there a T2 skill with this procedure? (skill name in the catalogue)
3. Is there a T3 doc that explains this? (INDEX.md)
4. Only if 1–3 fail: T1 session search

This forces T0 references to use T2/T3 by default and reserves T1 for genuinely unindexed history.

## T4 Observability (Phase 4)

T4 is never sacrificed. The observability work adds visibility, not constraint:

- log every T4 read/write event with source and timestamp
- dashboard showing T4 conflicts (where a doc and runtime disagreed)
- alert on any attempt to overwrite T4 from a doc summary

## Anti-Patterns to Avoid

- Cron alerts that fire but have no runbook attached
- Skill audits that produce a list but no remediation
- Doc reviews that just stamp dates without actually reading
- T1 search used as a substitute for thinking ("let me just grep past sessions")
- Treating T4 as backup storage that can be compressed
