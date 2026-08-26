# 05: Workspace rooting

**What to build:** All agent sessions run inside a dedicated workspace directory on the VPS (set via plain config), so the blast radius of any action is bounded before more power arrives. The CLI and gateway both honor it; reach-back mounts later would land inside this root.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Config key sets the workspace root; sessions resolve their cwd from it
- [ ] File/shell actions cannot escape the root by default
- [ ] Covered by a test using a temp workspace
