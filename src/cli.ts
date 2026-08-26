/**
 * Branded interactive CLI — minimal Slice 0 runner.
 *
 * Wraps the pi SDK with our identity (SOUL.md + brand), registers the
 * memory extension, and streams a simple chat loop to stdout.
 * (Full TUI wiring is roadmap Slice 2; this proves the pipeline.)
 */
import * as readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { createAgentSession, DefaultResourceLoader, getAgentDir, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import { BRAND } from "./brand.js";
import { buildSystemPrompt } from "./system-prompt.js";

// fileURLToPath, not URL.pathname — pathname percent-encodes spaces
// (e.g. "/app/Pi Project/"), producing a path pi cannot load.
const EXTENSION_DIR = fileURLToPath(new URL("../extensions/memory.ts", import.meta.url));

async function main() {
  const oneShot = process.argv[2] === "--say" ? process.argv[3] : undefined;

  console.log(`${BRAND.name} — ${BRAND.tagline}`);
  if (!oneShot) console.log(`type your message · /new reset · ctrl+c exit\n`);

  const modelRuntime = await ModelRuntime.create();
  const loader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    systemPromptOverride: buildSystemPrompt,
    additionalExtensionPaths: [EXTENSION_DIR],
  });
  await loader.reload();

  const { session } = await createAgentSession({
    cwd: process.cwd(),
    modelRuntime,
    resourceLoader: loader,
    sessionManager: SessionManager.create(process.cwd()),
  });

  session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }
    if (event.type === "tool_execution_start") {
      process.stdout.write(`\n[tool] ${event.toolName}\n`);
    }
  });

  if (oneShot) {
    await session.prompt(oneShot);
    process.stdout.write("\n");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  for (;;) {
    const input = (await rl.question("you › ")).trim();
    if (!input) continue;
    if (input === "/new") {
      console.log("(fresh session — memory persists)");
      continue;
    }
    try {
      await session.prompt(input);
      process.stdout.write("\n\n");
    } catch (err) {
      console.error(`[error] ${(err as Error).message}`);
    }
  }
}

main().catch((err) => {
  console.error(`fatal: ${err.message}`);
  process.exit(1);
});
