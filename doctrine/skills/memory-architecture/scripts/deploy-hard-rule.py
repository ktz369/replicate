#!/usr/bin/env python3
"""THREAD-ROUTING HARD RULE — reference helper (READ-ONLY).

Historical (Hermes era): on the Hermes stack this script deployed the
THREAD-ROUTING HARD RULE into `~/.hermes/config.yaml` channel prompts  (Historical (Hermes era))
(hot-reloaded without gateway restart), targeting Hermes thread IDs  (Historical (Hermes era))
1 (Core Group), 543640135 (DM), 856 (ASTRAL). That deployment logic is an
audit record only — it is intentionally NOT reproduced here.

On the current pi/bb stack the equivalent is a **read-only verifier**: check
whether the hard rule text is present in the pi profile config
(`~/.pi/agent/settings.json`) or pi AGENTS.md files. Editing the pi profile
config is operator-owned — this helper intentionally never writes to it
(profile config mutation requires explicit operator approval). Port the rule
text into whatever channel-prompt surface the current stack uses, then re-run
this check to confirm coverage.

Usage: python3 deploy-hard-rule.py [--check]

  --check   Scan read-only targets for the hard rule and report coverage
"""

import sys
import os

# Historical (Hermes era): Hermes config path was ~/.hermes/config.yaml.
# On the pi stack the profile config is ~/.pi/agent/settings.json — read-only
# here by design.
CONFIG_PATH = os.path.expanduser("~/.pi/agent/settings.json")

# Historical (Hermes era) anchor line from the Hermes config.yaml deployment.
# Kept for the audit record; not expected to appear on the pi stack.
ANCHOR_TEXT = "This applies to all 15 HCR agent threads, not just Core Group.'"

HARD_RULE = """THREAD-ROUTING HARD RULE (2026-06-04): Before any cross-thread send_message, verify the target thread_id against the canonical agent-thread mapping in the runtime thread listing (Historical (Hermes era): config.yaml channel_prompts or sessions.json; current stack: bb thread list / bb status and pi session JSONL paths). Do NOT route by T0 memory or inference alone. Thread misrouting is a T4 doctrine violation. If uncertain, cross-check both sources. Agent-thread mappings are RUNTIME TRUTH (T4), not recall (T1)."""


def scan_targets():
    """Read-only scan of profile-level targets for the hard rule text."""
    targets = [CONFIG_PATH]
    agents_md = os.path.expanduser("~/.pi/agent/AGENTS.md")
    if os.path.exists(agents_md):
        targets.append(agents_md)

    for path in targets:
        label = os.path.basename(path)
        if not os.path.exists(path):
            print(f"MISSING: {path} (not found — nothing to check)")
            continue
        with open(path, "r") as f:
            content = f.read()
        if "THREAD-ROUTING HARD RULE" in content:
            count = content.count("THREAD-ROUTING HARD RULE")
            print(f"PRESENT: {label} — {count} hard rule instance(s)")
        else:
            print(f"ABSENT:  {label} — hard rule not deployed on this surface")


def main():
    args = sys.argv[1:]

    if not args or "--check" in args:
        print("READ-ONLY CHECK — this helper never writes to the pi profile.")
        print("Rule text (for porting into the current channel-prompt surface):\n")
        print(HARD_RULE)
        print()
        scan_targets()
        print(
            "\nHistorical (Hermes era): the deployment inserted this rule "
            "after the anchor line (shown below) in each target block of the "
            "channel_prompts config. Hot-reload applied without restart. "
            "On the pi/bb stack, apply through the operator-approved prompt "
            "surface and re-run this check."
        )
        print(f"Anchor line (Historical (Hermes era)): {ANCHOR_TEXT}")
        return 0

    print(f"Unknown argument(s): {args}")
    print("This helper is read-only. Usage: deploy-hard-rule.py [--check]")
    return 2


if __name__ == "__main__":
    sys.exit(main())
