/**
 * Workspace rooting (ticket MAJ-6 / 05-workspace-rooting.md).
 *
 * All agent sessions run inside a dedicated workspace directory so the
 * blast radius of file/shell actions is bounded.
 *
 * Config surface (plain config, no daemon):
 *   MAJESTA_WORKSPACE  — absolute path to the workspace root.
 *   Default: <MAJESTA_HOME>/workspace.
 *
 * Path-based built-in tools are overridden with a containment guard that
 * delegates to pi's own tool implementations (createReadTool et al.), so
 * nothing pi ships is rebuilt. Shell commands inherit a cwd inside the root
 * because pi binds its tools to the session cwd; escaping that boundary via
 * shell syntax is an OS-sandbox concern pi deliberately does not solve
 * in-process (see pi docs/security.md, "No Built-in Sandbox") and is left to
 * deployment hardening.
 */
import { mkdirSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import {
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadTool,
	createWriteTool,
} from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { homeDir } from "./brand.js";

/** Resolve the configured workspace root; create it if missing. Returns canonical path. */
export function ensureWorkspaceRoot(): string {
	const root = resolve(process.env.MAJESTA_WORKSPACE ?? join(homeDir(), "workspace"));
	mkdirSync(root, { recursive: true });
	return realpathSync(root);
}

/** True if absolutePath is the root itself or lies underneath it (lexical check). */
export function isInsideRoot(root: string, absolutePath: string): boolean {
	const abs = resolve(absolutePath);
	return abs === root || abs.startsWith(root + sep);
}

/** Built-in tools that take a filesystem path and get a containment guard. */
const PATH_TOOLS = ["read", "write", "edit", "grep", "find", "ls"] as const;

type PathParams = { path?: string };
type AnyTool = ToolDefinition<any>;

/**
 * Extension factory overriding pi's path-based tools with rooted variants:
 * each tool resolves its target against the workspace root and refuses
 * paths outside it, delegating allowed calls to pi's own implementation.
 */
export function workspaceRootingExtension(root: string) {
	return (pi: ExtensionAPI): void => {
		// Loosely typed on purpose: one guard wraps six schemas uniformly.
		const builtins: Record<string, AnyTool> = {
			read: createReadTool(root),
			write: createWriteTool(root),
			edit: createEditTool(root),
			grep: createGrepTool(root),
			find: createFindTool(root),
			ls: createLsTool(root),
		};

		for (const name of PATH_TOOLS) {
			const inner = builtins[name];
			pi.registerTool({
				...inner,
				description: `${inner.description} Restricted to the workspace root (${root}); outside paths are blocked.`,
				async execute(toolCallId: string, params: PathParams, signal, onUpdate, _ctx) {
					const target = resolve(root, params.path ?? ".");
					if (!isInsideRoot(root, target)) {
						return {
							content: [
								{
									type: "text",
									text: `Blocked: "${String(params.path)}" resolves outside the workspace root (${root}).`,
								},
							],
							details: { blocked: true },
						};
					}
					return inner.execute(toolCallId, params as never, signal, onUpdate, _ctx);
				},
			} as AnyTool);
		}
	};
}
