# 04: Replicate → repo of record (archive Slice-0 code, host config)

**What to build:** The Replicate repo becomes the single home for MAJESTA's configuration and identity: persona files, profile settings (extensions/packages/skills lists), bridge + routing env templates, and the adopted doctrine copies. The redundant Slice-0 TypeScript (gateway, memory extension, CLI scaffold) is moved under an archive path in-repo — kept for history, clearly marked as not-live. Verified by the repo containing every artifact the bootstrap (04) needs, and nothing presenting itself as live code.

**Blocked by:** 03 (de-hermes-ify-doctrine) — the doctrine copies that land here are the corrected ones.

**Status:** draft-for-review (flip to ready-for-agent after owner approval)

- [ ] Config/persona/doctrine artifacts present and internally consistent
- [ ] Slice-0 TS archived in-repo with a README note explaining supersession
- [ ] No credentials in the repo (env templates with placeholders only)
- [ ] Repo README states the One Brain / Three Doors topology as the architecture of record
