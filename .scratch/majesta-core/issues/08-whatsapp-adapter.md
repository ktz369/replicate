# 08: WhatsApp adapter via Baileys

**What to build:** The second door. First move extracts the platform-adapter contract out of the Telegram code path (the wide refactor, done as expand-inside-this-slice so the slice still lands demoable); then a Baileys-based WhatsApp adapter implements it, including QR pairing, reconnect behavior, and sender allowlist — same brain, same memory, same approval buttons.

**Blocked by:** 06.

**Status:** ready-for-agent

- [ ] PlatformAdapter contract exists and Telegram uses it unchanged in behavior
- [ ] WhatsApp chat reaches MAJESTA and replies through the shared core
- [ ] QR pairing flow documented and repeatable after restart
- [ ] Adapter covered by the fake-transport contract test
