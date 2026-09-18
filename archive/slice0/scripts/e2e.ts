/**
 * E2E verification harness (ticket 02).
 *
 * Runs scripted one-shot scenarios against the REAL CLI entrypoint
 * (src/cli.ts) and the REAL provider, asserting external outcomes:
 *
 *   S1  exit code 0 + non-empty streamed response
 *   S2  memory_save round-trip: prompt → MEMORY.md content on disk
 *
 * Isolation: every scenario runs with
 *   - MAJESTA_HOME pointed at a fresh temp dir (memory writes land there)
 *   - PI_CODING_AGENT_DIR pointed at a temp agent dir that keeps the real
 *     models.json/auth.json but drops user-scope global extensions, so the
 *     toolset is deterministic (project-scope .pi packages still load —
 *     they are part of the product).
 *
 * Any assertion failure or crash exits non-zero: green output IS evidence.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const CLI = join(REPO_ROOT, "src", "cli.ts");
const SCENARIO_TIMEOUT_MS = 300_000;

interface ScenarioResult {
  name: string;
  ok: boolean;
  detail: string;
}


function makeTempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

/** Run one one-shot CLI conversation in an isolated environment. */
async function runCli(
  prompt: string,
  isolation: { majestaHome: string; agentDir: string },
): Promise<{ code: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", CLI, "--say", prompt],
      {
        cwd: REPO_ROOT,
        env: {
          ...process.env,
          MAJESTA_HOME: isolation.majestaHome,
          PI_CODING_AGENT_DIR: isolation.agentDir,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`scenario timed out after ${SCENARIO_TIMEOUT_MS}ms`));
    }, SCENARIO_TIMEOUT_MS);
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

/** Fresh isolation dirs; agentDir keeps real credentials, drops global extensions. */
function makeIsolation(): { majestaHome: string; agentDir: string; cleanup: () => void } {
  const majestaHome = makeTempDir("majesta-e2e-home-");
  const agentDir = makeTempDir("majesta-e2e-agent-");
  const realAgentDir = getRealAgentDir();
  for (const f of ["models.json", "auth.json"]) {
    const src = join(realAgentDir, f);
    if (existsSync(src)) symlinkSync(src, join(agentDir, f));
  }
  // Empty settings: no user-scope extensions, deterministic toolset.
  writeFileSync(join(agentDir, "settings.json"), "{}\n");
  return {
    majestaHome,
    agentDir,
    cleanup: () => {
      rmSync(majestaHome, { recursive: true, force: true });
      rmSync(agentDir, { recursive: true, force: true });
    },
  };
}

function getRealAgentDir(): string {
  // Mirrors pi's ENV_AGENT_DIR resolution for the *real* credentials dir.
  const override = process.env.MAJESTA_E2E_REAL_AGENT_DIR;
  if (override) return override;
  const fallback = join(process.env.HOME ?? "", ".pi", "agent");
  if (!existsSync(join(fallback, "models.json"))) {
    console.error(`No models.json found at ${fallback}; set MAJESTA_E2E_REAL_AGENT_DIR.`);
    process.exit(1);
  }
  return fallback;
}


async function scenarioHello(): Promise<void> {
  const iso = makeIsolation();
  try {
    const { code, stdout } = await runCli(`Reply with exactly: E2E-HELLO-OK`, iso);
    assert(code === 0, `expected exit code 0, got ${code}\nstdout:\n${stdout}`);
    assert(stdout.trim().length > 0, "expected non-empty streamed output");
    assert(stdout.includes("E2E-HELLO-OK"), `expected marker in streamed output, got:\n${stdout}`);
  } finally {
    iso.cleanup();
  }
}

async function scenarioMemoryRoundTrip(): Promise<void> {
  const canary = `CRIMSON-TIDE-${Date.now()}`;
  const iso = makeIsolation();
  try {
    const { code, stdout } = await runCli(
      `Call the memory_save tool right now with content: my e2e canary word is ${canary}. Then reply DONE.`,
      iso,
    );
    assert(code === 0, `expected exit code 0, got ${code}\nstdout:\n${stdout}`);
    const memoryFile = join(iso.majestaHome, "MEMORY.md");
    assert(existsSync(memoryFile), `MEMORY.md was not created at ${memoryFile}\nstdout:\n${stdout}`);
    const body = readFileSync(memoryFile, "utf8");
    assert(body.includes(canary), `canary "${canary}" missing from MEMORY.md:\n${body}`);
  } finally {
    iso.cleanup();
  }
}

async function main() {
  const scenarios: Array<{ name: string; fn: () => Promise<void> }> = [
    { name: "S1 hello: exit 0 + non-empty streamed response", fn: scenarioHello },
    { name: "S2 memory round-trip: memory_save → MEMORY.md", fn: scenarioMemoryRoundTrip },
  ];

  console.log("MAJESTA e2e — real CLI, real provider\n");
  const results: ScenarioResult[] = [];
  for (const s of scenarios) {
    process.stdout.write(`▸ ${s.name} ... `);
    try {
      await s.fn();
      results.push({ name: s.name, ok: true, detail: "ok" });
      console.log("PASS");
    } catch (err) {
      results.push({ name: s.name, ok: false, detail: (err as Error).message });
      console.log("FAIL");
      console.error(`  ${(err as Error).message.split("\n").join("\n  ")}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
  if (failed.length > 0) {
    console.error("E2E FAILURE — see details above.");
    process.exit(1);
  }
  console.log("E2E GREEN");
}

main().catch((err) => {
  console.error(`fatal: ${err.message}`);
  process.exit(1);
});
