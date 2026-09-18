# 07: Cross-door memory proof (the round-trip contract)

**What to build:** Proof that the consolidation achieved "one being across doors": a memory written from a Telegram-originated session is recalled correctly in a bb thread, and a memory written in a bb thread is recalled from the Telegram side — same bank, same identity. This is the behavioral definition-of-done for the whole spec, demonstrated once with logged evidence.

**Blocked by:** 01 (adopt-skill-assets), 02 (wire-mnemosyne), 06 (retire-acp-custom) — both doors must be on the final topology.

**Status:** draft-for-review (flip to ready-for-agent after owner approval)

- [ ] Telegram → bb memory recall demonstrated with logged evidence
- [ ] bb → Telegram memory recall demonstrated with logged evidence
- [ ] Round-trip uses the post-consolidation bank (no legacy-bank borrowing)
