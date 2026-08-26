/**
 * Workspace rooting tests (ticket MAJ-6 / 05-workspace-rooting.md).
 *
 * Covers, against a temp workspace:
 *   - config surface: MAJESTA_WORKSPACE override + MAJESTA_HOME default
 *   - root creation on demand
 *   - path containment predicate (inside / sibling-prefix / traversal)
 *   - guarded tools: blocked outside-root access, working inside-root access
 *     via delegation to pi's real tool implementations
 *
 * No provider/network needed — the guard is exercised directly.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { ensureWorkspaceRoot, isInsideRoot, workspaceRootingExtension } from "../src/workspace.js";

function tempDir(prefix: string): string {
	return mkdtempSync(join(tmpdir(), prefix));
}

/** Point MAJESTA_WORKSPACE at a fresh temp dir; returns [root, restore]. */
function withTempWorkspace(): [string, () => void] {
	const root = tempDir("majesta-wsroot-");
	process.env.MAJESTA_WORKSPACE = root;
	return [
		root,
		() => {
			delete process.env.MAJESTA_WORKSPACE;
			rmSync(root, { recursive: true, force: true });
		},
	];
}

test("MAJESTA_WORKSPACE overrides the workspace root and is created on demand", () => {
	const base = tempDir("majesta-ws-");
	const ws = join(base, "nested/root");
	process.env.MAJESTA_WORKSPACE = ws;
	try {
		const root = ensureWorkspaceRoot();
		assert.equal(root, ws);
		assert.ok(existsSync(ws), "ensureWorkspaceRoot must create the directory");
	} finally {
		delete process.env.MAJESTA_WORKSPACE;
		rmSync(base, { recursive: true, force: true });
	}
});

test("default root falls back to <MAJESTA_HOME>/workspace", () => {
	const home = tempDir("majesta-home-");
	process.env.MAJESTA_HOME = home;
	delete process.env.MAJESTA_WORKSPACE;
	try {
		const root = ensureWorkspaceRoot();
		assert.equal(root, join(home, "workspace"));
	} finally {
		delete process.env.MAJESTA_HOME;
		rmSync(home, { recursive: true, force: true });
	}
});

test("isInsideRoot accepts root itself and children, rejects siblings and traversal", () => {
	const root = tempDir("majesta-root-");
	const sibling = `${root}-sibling`;
	try {
		assert.ok(isInsideRoot(root, root));
		assert.ok(isInsideRoot(root, join(root, "a.txt")));
		assert.ok(isInsideRoot(root, join(root, "sub/dir/b.txt")));
		// sibling sharing a string prefix ("root-xyz" vs "root") must not pass
		mkdirSync(sibling, { recursive: true });
		assert.ok(!isInsideRoot(root, sibling));
		assert.ok(!isInsideRoot(root, join(sibling, "c.txt")));
		// lexical traversal escapes after resolve()
		assert.ok(!isInsideRoot(root, join(root, "..", "elsewhere.txt")));
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(sibling, { recursive: true, force: true });
	}
});

/** Minimal ExtensionAPI stub capturing registerTool calls. */
function captureTools(): { pi: ExtensionAPI; tools: Map<string, ToolDefinition<any>> } {
	const tools = new Map<string, ToolDefinition<any>>();
	const pi = {
		registerTool: (tool: ToolDefinition<any>) => {
			tools.set(tool.name, tool);
		},
	} as unknown as ExtensionAPI;
	return { pi, tools };
}

const fakeCtx = {} as any;

/** First content block of a tool result as text. */
function resultText(result: { content: Array<{ type: string; text?: string }> }): string {
	return String(result.content[0]?.text ?? "");
}

test("guarded tools override read/write/edit/grep/find/ls", () => {
	const [root, restore] = withTempWorkspace();
	try {
		const { pi, tools } = captureTools();
		workspaceRootingExtension(root)(pi);
		for (const name of ["read", "write", "edit", "grep", "find", "ls"]) {
			assert.ok(tools.has(name), `expected guarded ${name} to be registered`);
		}
		assert.ok(!tools.has("bash"), "bash is rooted via session cwd, not overridden");
	} finally {
		restore();
	}
});

test("write+read inside the root work through pi's real implementations", async () => {
	const [root, restore] = withTempWorkspace();
	try {
		const { pi, tools } = captureTools();
		workspaceRootingExtension(root)(pi);

		const marker = `ROOTED-${Date.now()}`;
		const writeResult = await tools.get("write")!.execute(
			"t1",
			{ path: "canary/note.md", content: `${marker}\n` },
			undefined,
			undefined,
			fakeCtx,
		);
		assert.match(resultText(writeResult), /note\.md/);
		assert.equal(readFileSync(join(root, "canary", "note.md"), "utf8"), `${marker}\n`);

		const readResult = await tools.get("read")!.execute(
			"t2",
			{ path: "canary/note.md" },
			undefined,
			undefined,
			fakeCtx,
		);
		assert.ok(resultText(readResult).includes(marker));
	} finally {
		restore();
	}
});

test("path tools refuse targets outside the root", async () => {
	const [root, restore] = withTempWorkspace();
	const outsideDir = tempDir("majesta-outside-");
	try {
		const secret = `OUTSIDE-CANARY-${Date.now()}`;
		writeFileSync(join(outsideDir, "secret.txt"), `${secret}\n`);

		const { pi, tools } = captureTools();
		workspaceRootingExtension(root)(pi);

		// absolute escape
		const abs = await tools.get("read")!.execute(
			"t3",
			{ path: join(outsideDir, "secret.txt") },
			undefined,
			undefined,
			fakeCtx,
		);
		assert.match(resultText(abs), /Blocked/);
		assert.ok(!resultText(abs).includes(secret), "outside content must not leak");

		// relative traversal escape
		const trav = await tools.get("read")!.execute(
			"t4",
			{ path: join(root, "..", outsideDir.split("/").pop()!, "secret.txt") },
			undefined,
			undefined,
			fakeCtx,
		);
		assert.match(resultText(trav), /Blocked/);

		// writes are equally contained — nothing may be planted outside
		const wr = await tools.get("write")!.execute(
			"t5",
			{ path: join(outsideDir, "planted.txt"), content: "nope" },
			undefined,
			undefined,
			fakeCtx,
		);
		assert.match(resultText(wr), /Blocked/);
		assert.ok(!existsSync(join(outsideDir, "planted.txt")), "no file may be written outside the root");
	} finally {
		rmSync(outsideDir, { recursive: true, force: true });
		restore();
	}
});
