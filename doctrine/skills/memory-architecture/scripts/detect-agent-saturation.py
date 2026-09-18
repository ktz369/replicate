#!/usr/bin/env python3
"""Detect agent saturation — sessions that receive messages but produce no output.

Usage: python3 detect-agent-saturation.py [--threshold 65000]

Threshold defaults to 65,000 estimated prompt tokens. Sessions above this that have
received messages in the last 15 minutes without producing output are flagged.

Historical (Hermes era): the Hermes version read `~/.hermes/sessions/sessions.json`
for exact `last_prompt_tokens` values and tailed the gateway log for
`Flushing text batch` (outbound) vs `inbound message` lines. On the pi/bb stack:
- session transcripts live under `~/.pi/agent/sessions/<project>/*.jsonl` and carry
  no token-count field, so tokens are ESTIMATED at ~4 chars/token;
- there is no central gateway log — point GATEWAY_LOG at whatever bridge log the
  current stack writes (env `PI_GATEWAY_LOG`); heuristic line matches are kept as
  a labeled approximation of the Historical (Hermes era) pattern.
Saturation remains externally detectable: the agent cannot self-diagnose. Reset is
operator-owned on this stack (Historical (Hermes era): `hermes session reset --session-key`).

Exit code 0: no saturated agents found (quiet)
Exit code 1: saturated agents detected (output lists them)
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta

SESSIONS_DIR = os.path.expanduser(os.environ.get("PI_SESSIONS_DIR", "~/.pi/agent/sessions"))
GATEWAY_LOG = os.environ.get(
    "PI_GATEWAY_LOG", os.path.expanduser("~/.pi/agent/logs/gateway.log")
)

THRESHOLD = 65000
if '--threshold' in sys.argv:
    idx = sys.argv.index('--threshold')
    THRESHOLD = int(sys.argv[idx+1])

CHARS_PER_TOKEN = 4  # rough estimate — pi JSONL has no token-count field


def load_sessions():
    """Yield (session_key, path, size_bytes) for pi session JSONL transcripts."""
    if not os.path.isdir(SESSIONS_DIR):
        return
    for project_dir in sorted(os.listdir(SESSIONS_DIR)):
        proj_path = os.path.join(SESSIONS_DIR, project_dir)
        if not os.path.isdir(proj_path):
            continue
        for fname in sorted(os.listdir(proj_path)):
            if fname.endswith(".jsonl"):
                path = os.path.join(proj_path, fname)
                yield f"{project_dir}/{fname[:-6]}", path, os.path.getsize(path)


def check_recent_activity(session_key, minutes=15):
    """Check if session had inbound activity recently but no output.

    Heuristic, labeled: scans the configured bridge/gateway log for lines naming the
    session and classifies them as outbound ('Flushing text batch' — Historical (Hermes era) marker
    kept for parity) or inbound ('inbound message'). If no log exists, returns
    (None, None) and size-based estimation is the only signal.
    """
    if not os.path.exists(GATEWAY_LOG):
        return None, None

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)

    last_inbound = None
    last_outbound = None

    with open(GATEWAY_LOG, 'r', errors='replace') as f:
        for line in f:
            if session_key not in line:
                continue
            # Historical (Hermes era): 'Flushing text batch' = agent output
            if 'Flushing text batch' in line:
                try:
                    ts_str = line.split(' INFO ')[0]
                    ts = datetime.fromisoformat(ts_str)
                    if ts > cutoff:
                        last_outbound = ts
                except (ValueError, IndexError):
                    pass
            # Inbound message (not our output)
            elif 'inbound message' in line:
                try:
                    ts_str = line.split(' INFO ')[0]
                    ts = datetime.fromisoformat(ts_str)
                    if ts > cutoff:
                        last_inbound = ts
                except (ValueError, IndexError):
                    pass

    return last_inbound, last_outbound


def main():
    saturated = []

    for key, path, size in load_sessions():
        est_tokens = size // CHARS_PER_TOKEN
        if est_tokens < THRESHOLD:
            continue

        last_in, last_out = check_recent_activity(key)

        # Saturated: high estimated tokens + inbound activity + NO output.
        # Without a gateway log, flag on size alone (advisory).
        if (last_in and (not last_out or last_in > last_out)) or (
            last_in is None and last_out is None
        ):
            saturated.append({
                'key': key,
                'est_tokens': est_tokens,
                'bytes': size,
                'last_inbound': str(last_in) if last_in else 'unknown (no log)',
                'last_outbound': str(last_out) if last_out else 'unknown (no log)',
            })

    if saturated:
        print(f"SATURATED AGENTS (>{THRESHOLD} est tokens, inbound but no output):")
        for a in saturated:
            print(f"  {a['key']}")
            print(f"    est tokens: {a['est_tokens']}  last_in: {a['last_inbound']}  last_out: {a['last_outbound']}")
            print("    FIX: operator-owned — reset/restart the session via the current")
            print("         stack's session management (Historical (Hermes era):")
            print("         `hermes session reset --session-key \"<key>\"`).")  # Historical (Hermes era)
        return 1
    else:
        # Silent — no saturated agents
        return 0

if __name__ == '__main__':
    sys.exit(main())
