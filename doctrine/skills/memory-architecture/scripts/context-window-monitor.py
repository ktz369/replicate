#!/usr/bin/env python3
"""Context window monitor — detect sessions approaching threshold.

Usage: python3 context-window-monitor.py [--max-window 131072] [--threshold-pct 0.40]

Scans the pi profile's session directory (`~/.pi/agent/sessions/<project-dir>/*.jsonl`)
and flags sessions whose transcript size crosses the threshold.

Historical (Hermes era): the Hermes version read `sessions.json` and used the exact
`last_prompt_tokens` field per session. pi session JSONL transcripts do not expose a
token-count field, so this port ESTIMATES tokens at ~4 characters per token. The
estimate is intentionally coarse — treat tier labels as advisory, not exact telemetry.

Outputs one line per flagged session suitable for cron (mini-cron / cron bb) alert
delivery.

Exit codes:
  0 — no sessions flagged (quiet output)
  1 — sessions flagged (outputs alert lines)

Risk tiers:
  40-55%  = WARNING  — draft handoff brief
  55-70%  = CRITICAL — handoff + reset ASAP
  >70%    = COLLAPSED — reset immediately
"""

import os
import sys

SESSIONS_DIR = os.path.expanduser(
    os.environ.get("PI_SESSIONS_DIR", "~/.pi/agent/sessions")
)

MAX_WINDOW = int(os.environ.get("CONTEXT_WINDOW_MAX", 131072))
THRESHOLD_PCT = 0.40
CHARS_PER_TOKEN = 4  # rough estimate — pi JSONL has no token-count field


def parse_args():
    global MAX_WINDOW, THRESHOLD_PCT
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--max-window" and i + 1 < len(args):
            MAX_WINDOW = int(args[i + 1])
            i += 2
        elif args[i] == "--threshold-pct" and i + 1 < len(args):
            THRESHOLD_PCT = float(args[i + 1])
            i += 2
        else:
            i += 1


def risk_tier(pct):
    if pct > 0.70:
        return "COLLAPSED", "reset immediately"
    elif pct > 0.55:
        return "CRITICAL", "handoff + reset ASAP"
    elif pct > THRESHOLD_PCT:
        return "WARNING", "draft handoff brief"
    return None, None


def list_session_files():
    """Yield (display_key, path) for every pi session JSONL in the profile."""
    if not os.path.isdir(SESSIONS_DIR):
        return
    for project_dir in sorted(os.listdir(SESSIONS_DIR)):
        proj_path = os.path.join(SESSIONS_DIR, project_dir)
        if not os.path.isdir(proj_path):
            continue
        for fname in sorted(os.listdir(proj_path)):
            if fname.endswith(".jsonl"):
                yield f"{project_dir}/{fname[:-6]}", os.path.join(proj_path, fname)


def main():
    parse_args()
    threshold_tokens = int(MAX_WINDOW * THRESHOLD_PCT)

    flagged = []
    for key, path in list_session_files():
        try:
            size = os.path.getsize(path)
        except OSError:
            continue
        est_tokens = size // CHARS_PER_TOKEN
        pct = est_tokens / MAX_WINDOW if MAX_WINDOW else 0
        tier, action = risk_tier(pct)
        if tier is None:
            continue
        flagged.append(
            {
                "key": key,
                "est_tokens": est_tokens,
                "bytes": size,
                "pct": pct,
                "tier": tier,
                "action": action,
            }
        )

    if not flagged:
        return 0

    print(
        f"CONTEXT WINDOW ALERT (token counts are ESTIMATED at "
        f"~{CHARS_PER_TOKEN} chars/token) — {len(flagged)} session(s) above "
        f"{THRESHOLD_PCT*100:.0f}% ({threshold_tokens:,} tokens):\n"
    )
    for f in flagged:
        print(f"  [{f['tier']}] {f['key']}")
        print(
            f"    est tokens: {f['est_tokens']:,} (~{f['pct']*100:.1f}% of window)"
            f"  |  transcript size: {f['bytes']:,} bytes"
        )
        print(f"    action: {f['action']}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
