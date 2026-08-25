/**
 * Single source of truth for branding.
 * Change these constants and the whole agent re-brands:
 * CLI banner, system prompt identity, data dir name, docs.
 */
export const BRAND = {
  /** Agent display name (placeholder — rename me). */
  name: "OxAgent",
  /** Short lowercase id used for dirs / binary name. */
  id: "oxagent",
  tagline: "self-improving companion on the pi harness",
  author: "your-name-here",
  repoUrl: "https://example.com/oxagent",
} as const;

/** Root dir for runtime state: memory, profiles. Override with OXAGENT_HOME. */
export function homeDir(): string {
  return process.env.OXAGENT_HOME ?? `${process.env.HOME}/.${BRAND.id}`;
}
