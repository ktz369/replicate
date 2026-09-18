/**
 * Contract tests for buildSystemPrompt() (ticket 03).
 *
 * Uses temp-dir fixtures only — no network, no real credentials.
 * The prompt builder is exercised via its injectable { cwd, home } options
 * so tests never mutate global process state.
 */
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { BRAND } from "../src/brand.js";
import { buildSystemPrompt, MAX_MEMORY_CHARS } from "../src/system-prompt.js";

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), "majesta-home-"));
}

function makeRepo(soul?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "majesta-repo-"));
  if (soul !== undefined) {
    mkdirSync(join(dir, "soul"));
    writeFileSync(join(dir, "soul", "SOUL.md"), soul);
  }
  return dir;
}

test("substitutes all template placeholders in SOUL.md", () => {
  const soul = "# Soul\nName: {{AGENT_NAME}}\nAuthor: {{AUTHOR}}\n";
  const prompt = buildSystemPrompt({ cwd: makeRepo(soul), home: makeHome() });

  assert.ok(prompt.includes(BRAND.name), "AGENT_NAME substituted");
  assert.ok(prompt.includes(BRAND.author), "AUTHOR substituted");
  assert.ok(!prompt.includes("{{"), "no leftover placeholder braces");
});

test("rejects SOUL.md with unknown placeholders instead of leaking them", () => {
  const soul = "You are {{AGENT_NAME}}, serving {{UNKNOWN_TOKEN}}.";
  assert.throws(
    () => buildSystemPrompt({ cwd: makeRepo(soul), home: makeHome() }),
    /UNKNOWN_TOKEN/,
  );
});

test("bounds oversized MEMORY.md with an explicit truncation marker", () => {
  const bigMemory = `# Memory\n${"x".repeat(MAX_MEMORY_CHARS + 50_000)}`;
  const prompt = buildSystemPrompt({ cwd: makeRepo(), home: makeHomeWithMemory(bigMemory) });

  assert.ok(prompt.includes("truncated"), "truncation marker present");
  assert.ok(
    !prompt.includes("x".repeat(MAX_MEMORY_CHARS + 1000)),
    "oversized body not included in full",
  );
});

test("includes small MEMORY.md verbatim", () => {
  const memory = "- Operator prefers dark mode.";
  const prompt = buildSystemPrompt({ cwd: makeRepo(), home: makeHomeWithMemory(memory) });

  assert.ok(prompt.includes("- Operator prefers dark mode."));
  assert.ok(!prompt.includes("truncated"));
});

test("falls back to built-in identity when SOUL.md is missing", () => {
  const prompt = buildSystemPrompt({ cwd: makeRepo(), home: makeHome() });

  assert.ok(
    prompt.includes(`You are ${BRAND.name}`),
    `fallback identity present:\n${prompt.slice(0, 300)}`,
  );
  assert.ok(!prompt.includes("## Soul"), "no soul section rendered");
});

test("tier ordering is stable → context → volatile", () => {
  const soul = "# Soul\ncustom-identity-marker";
  const prompt = buildSystemPrompt({
    cwd: makeRepo(soul),
    home: makeHomeWithMemory("- memory-marker"),
    now: new Date("2026-08-26T00:00:00.000Z"),
  });

  const soulAt = prompt.indexOf("custom-identity-marker");
  const briefAt = prompt.indexOf("## Operating brief");
  const memoryAt = prompt.indexOf("## Memory snapshot");
  const timeAt = prompt.indexOf("Current time: 2026-08-26");

  assert.ok(soulAt !== -1, "soul tier rendered");
  assert.ok(briefAt > soulAt, "operating brief after soul");
  assert.ok(memoryAt > briefAt, "memory snapshot after operating brief");
  assert.ok(timeAt > memoryAt, "timestamp last");
});

function makeHomeWithMemory(memory: string): string {
  const home = makeHome();
  writeFileSync(join(home, "MEMORY.md"), memory);
  return home;
}
