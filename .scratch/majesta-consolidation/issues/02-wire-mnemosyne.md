# 02: Wire Mnemosyne memory into the bb pi profile

**What to build:** Memory works from a bb thread: the mnemosyne extension is loaded by the bb profile's pi and a memory written in a bb thread is recallable afterwards. This is the memory-layer half of the brain adoption, kept atomic from skills so each lands with its own proof. Verified by a real round-trip (write + recall) from a bb thread.

**Blocked by:** None (can start immediately — independent of 01).

**Status:** ready-for-agent

- [ ] mnemosyne extension registered in the bb profile's pi settings and loads without error
- [ ] Memory write + recall round-trip succeeds from a real bb thread (evidence logged)
- [ ] Bank used is the post-consolidation target bank (no accidental legacy-bank split)
