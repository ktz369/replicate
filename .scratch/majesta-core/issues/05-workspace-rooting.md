# 05: Workspace rooting

**What to build:** All agent sessions run inside a dedicated workspace directory on the VPS (set via plain config), so the blast radius of any action is bounded before more power arrives. The CLI and gateway both honor it; reach-back mounts later would land inside this root.

**Blocked by:** None (can start immediately).

**Status:** closed

- [x] Config key sets the workspace root; sessions resolve their cwd from it
- [x] File/shell actions cannot escape the root by default (path-based tools guarded; bash runs rooted at the session cwd — shell-syntax escapes are an OS-sandbox concern, see comments)
- [x] Covered by a test using a temp workspace

## Comments

### agent (MAJ-6 worker) · 2026-08-26

Implemented on branch `bb/maj-6-05-workspace-rooting-thr_3ce3r3rtfb`.

**Config surface** (`src/workspace.ts`):
- `MAJESTA_WORKSPACE` env var sets the workspace root; default `<MAJESTA_HOME>/workspace`
  (reuses the existing MAJESTA_HOME convention from `src/brand.ts`).
- `ensureWorkspaceRoot()` resolves, creates on demand, and returns the canonical path.

**cwd resolution:** `src/cli.ts` and `gateway/gateway.ts` now pass the resolved root as `cwd`
to `DefaultResourceLoader`, `createAgentSession`, and `SessionManager` — pi pins tool cwds and
session files there. No reimplementation of what pi ships.

**Escape guard (default boundary):** `workspaceRootingExtension(root)` overrides pi's path-taking
tools (`read`, `write`, `edit`, `grep`, `find`, `ls`) via `extensionFactories`; each resolves its
target against the root, refuses outside paths, and **delegates allowed calls to pi's own
tool implementations** (`createReadTool(root)` et al.), so result shapes/behavior stay pi's.
Bash is not overridden: pi binds it to the session cwd (inside the root).

**Known limitation (honest scope):** a shell command's *syntax* can still reference paths outside
the root. Pi deliberately ships no in-process sandbox for that (pi docs/security.md,
"No Built-in Sandbox"); real containment is an OS/container concern deferred to deployment
hardening (ticket 11). This ticket delivers the default rooting boundary.

**Evidence:**
- `npm test` → 6/6 pass (`tests/workspace-rooting.test.ts`: config override + default fallback,
  root creation, containment predicate incl. sibling-prefix and traversal cases, guarded-tool
  override set, inside-root write/read round-trip through pi's real write/read tools,
  outside-root read/write blocked with no content leak or planted file).
- `tsc --noEmit --strict` clean over `src/workspace.ts`, `tests/workspace-rooting.test.ts`,
  `src/cli.ts`, `gateway/gateway.ts`.
- Real CLI smoke with provider: `MAJESTA_WORKSPACE=<tmpdir>/workspace npm run cli -- --say ...` →
  exit 0, reply `ROOT-SMOKE-OK`, workspace dir created; asking the agent to run `pwd` returned
  `/tmp/tmp.FAN4rf4DpN/workspace` (the configured root).
