import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND, homeDir } from "./brand.js";

/** Hard cap for the MEMORY.md injection in the context tier. */
export const MAX_MEMORY_CHARS = 4096;

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
export interface PromptOptions {
  /** Repo root containing soul/SOUL.md. Defaults to process.cwd(). */
  cwd?: string;
  /** Agent home containing MEMORY.md. Defaults to homeDir(). */
  home?: string;
  /** Timestamp for the volatile tier. Defaults to now (tests pin it). */
  now?: Date;
}

export function buildSystemPrompt(opts: PromptOptions = {}): string {
  const cwd = opts.cwd ?? process.cwd();
  const home = opts.home ?? homeDir();
  const stable: string[] = [];
  const context: string[] = [];

  // ── Stable tier ────────────────────────────────────────────────
  const soul = readIfExists(join(cwd, "soul", "SOUL.md"));
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
  const memory = readIfExists(join(home, "MEMORY.md"));
  if (memory) {
    const trimmed = memory.trim();
    const bounded =
      trimmed.length > MAX_MEMORY_CHARS
        ? `${trimmed.slice(0, MAX_MEMORY_CHARS)}\n\n[MEMORY.md truncated: showing first ${MAX_MEMORY_CHARS} of ${trimmed.length} characters]`
        : trimmed;
    context.push(["## Memory snapshot", "", bounded, ""].join("\n"));
  } else {
    context.push(
      "## Memory snapshot\n\n(empty so far — start building it with memory_save when you learn something durable.)\n",
    );
  }

  // ── Volatile tier ──────────────────────────────────────────────
  return [...stable, ...context, `Current time: ${(opts.now ?? new Date()).toISOString()}`].join("\n\n");
}

function readIfExists(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function renderTemplate(soul: string): string {
  const rendered = soul
    .replaceAll("{{AGENT_NAME}}", BRAND.name)
    .replaceAll("{{AUTHOR}}", BRAND.author);

  // Validate: fail loudly on placeholders the renderer does not know,
  // instead of silently leaking {{SOMETHING}} into the live prompt.
  const leftover = [...rendered.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]);
  if (leftover.length > 0) {
    throw new Error(
      `SOUL.md contains unsubstituted placeholders: ${[...new Set(leftover)].join(", ")} — add them to renderTemplate()`,
    );
  }
  return rendered;
}

function fallbackIdentity(): string {
  return `You are ${BRAND.name} — ${BRAND.tagline}. Built by ${BRAND.author}.`;
}
