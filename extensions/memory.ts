/**
 * Memory extension — the "learning loop" slice, Hermes-style but thin.
 *
 * Ported concepts from hermes-agent/agent/memory_manager.py:
 *   - durable agent-curated memory (MEMORY.md under the agent home)
 *   - save/search tools the LLM calls itself
 *   (snapshot injection into context is handled by src/system-prompt.ts)
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Type } from "typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { BRAND, homeDir } from "../src/brand.js";

function memoryPath(): string {
  const dir = homeDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, "MEMORY.md");
}

export default function memoryExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "memory_save",
    label: "Memory Save",
    description:
      "Persist a durable fact to long-term memory (MEMORY.md). Use for operator preferences, project facts, lessons learned. One concise line per fact.",
    parameters: Type.Object({
      content: Type.String({ description: "The fact to remember, one line" }),
      tags: Type.Optional(
        Type.Array(Type.String(), { description: "Optional tags, e.g. [\"preference\"]" }),
      ),
    }),
    async execute(_toolCallId, params) {
      const path = memoryPath();
      const stamp = new Date().toISOString().slice(0, 10);
      const tags = params.tags?.length ? ` #${params.tags.join(" #")}` : "";
      appendFileSync(path, `- [${stamp}] ${params.content.trim()}${tags}\n`, "utf8");
      return {
        content: [{ type: "text", text: `Saved to memory: ${params.content}` }],
        details: { path },
      };
    },
  });

  pi.registerTool({
    name: "memory_search",
    label: "Memory Search",
    description: "Search long-term memory (case-insensitive substring match over MEMORY.md lines).",
    parameters: Type.Object({
      query: Type.String({ description: "Text to look for" }),
    }),
    async execute(_toolCallId, params) {
      const path = memoryPath();
      if (!existsSync(path)) {
        return { content: [{ type: "text", text: "Memory is empty." }], details: { hits: 0 } };
      }
      const q = params.query.toLowerCase();
      const hits = readFileSync(path, "utf8")
        .split("\n")
        .filter((line) => line.toLowerCase().includes(q));
      const text = hits.length ? hits.join("\n") : `No memories matching "${params.query}".`;
      return { content: [{ type: "text", text }], details: { hits: hits.length } };
    },
  });

  pi.registerCommand("memory", {
    description: "Show the raw MEMORY.md file",
    handler: async (_args, ctx) => {
      const path = memoryPath();
      const body = existsSync(path) ? readFileSync(path, "utf8") : "(memory is empty)";
      ctx.ui.notify(`${BRAND.name} memory (${path}):\n${body}`, "info");
    },
  });

  // Learning-loop nudge: at end of each agent run, remind via session entry
  // that durable knowledge should be persisted. Cheap, no LLM call.
  pi.on("agent_end", async () => {
    pi.appendEntry("oxa-memory-nudge", {
      hint: "If anything durable was learned this turn, call memory_save.",
      at: new Date().toISOString(),
    });
  });

  // Ensure the file exists so system-prompt tier-2 reads something stable.
  pi.on("session_start", async () => {
    const path = memoryPath();
    if (!existsSync(path)) writeFileSync(path, `# ${BRAND.name} memory\n`, "utf8");
  });
}
