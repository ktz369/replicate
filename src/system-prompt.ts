import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND, homeDir } from "./brand.js";

/**
 * Hermes-style three-tier system prompt, adapted to pi:
 *
 *   stable   — soul identity (SOUL.md) + operating brief
 *   context  — memory snapshot (MEMORY.md) + operator profile
 *   volatile — timestamp line
 *
 * Pi renders this once per session (prompt-cache friendly across turns),
 * mirroring hermes-agent's cache-tier discipline in agent/system_prompt.py.
 */
export function buildSystemPrompt(): string {
  const stable: string[] = [];
  const context: string[] = [];

  // ── Stable tier ────────────────────────────────────────────────
  const soul = readIfExists(join(process.cwd(), "soul", "SOUL.md"));
  if (soul) {
    stable.push(renderTemplate(soul));
  } else {
    stable.push(fallbackIdentity());
  }

  stable.push(
    [
      "## Operating brief",
      "",
      `- You run on the pi harness (tools: read/bash/edit/write/grep/find/ls).`,
      `- Verify before claiming: real tool output is your only evidence.`,
      `- Batch independent tool calls in one turn when possible.`,
      `- Skills live under ~/.${BRAND.id}/skills and .pi/skills; consult them when relevant.`,
      `- Your durable memory lives in MEMORY.md (via memory_save/memory_search tools).`,
    ].join("\n"),
  );

  // ── Context tier ───────────────────────────────────────────────
  const memory = readIfExists(join(homeDir(), "MEMORY.md"));
  if (memory) {
    context.push(
      ["## Memory snapshot", "", memory.trim(), ""].join("\n"),
    );
  } else {
    context.push(
      "## Memory snapshot\n\n(empty so far — start building it with memory_save when you learn something durable.)\n",
    );
  }

  // ── Volatile tier ──────────────────────────────────────────────
  const volatile = `Current time: ${new Date().toISOString()}`;

  return [...stable, ...context, volatile].join("\n\n");
}

function readIfExists(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function renderTemplate(soul: string): string {
  return soul
    .replaceAll("{{AGENT_NAME}}", BRAND.name)
    .replaceAll("{{AUTHOR}}", BRAND.author);
}

function fallbackIdentity(): string {
  return `You are ${BRAND.name} — ${BRAND.tagline}. Built by ${BRAND.author}.`;
}
