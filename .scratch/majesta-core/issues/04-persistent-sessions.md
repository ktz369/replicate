# 04: Persistent gateway sessions

**What to build:** Gateway chats stop dying on restart: per-chat sessions are persisted/resumable instead of held in memory, so a deploy or crash preserves every conversation. Verified by restarting the gateway mid-conversation and continuing seamlessly.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Conversation survives a gateway restart and continues with context intact
- [ ] Session store lives under the agent home, profile-safe
- [ ] E2E or manual restart evidence recorded in ticket comments
