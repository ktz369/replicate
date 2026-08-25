/**
 * Messaging gateway skeleton — the Hermes "lives where you do" slice.
 *
 * Thin Telegram bridge on top of the pi SDK (long polling, zero extra deps).
 * One AgentSession per chat id. Requires TG_BOT_TOKEN in env.
 *
 *   TG_BOT_TOKEN=123:abc npx tsx gateway/gateway.ts
 *
 * Roadmap: voice notes, streaming edits, Discord/Slack adapters,
 * cron delivery — mirroring hermes gateway/platforms/*.
 */
import { createAgentSession, DefaultResourceLoader, getAgentDir, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";
import type { AgentSession } from "@earendil-works/pi-coding-agent";
import { BRAND } from "../src/brand.js";
import { buildSystemPrompt } from "../src/system-prompt.js";

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/${method}`;

async function tg(method: string, body?: Record<string, unknown>) {
  const res = await fetch(API(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as { ok: boolean; result?: any };
}

async function send(chatId: number | string, text: string) {
  await tg("sendMessage", { chat_id: chatId, text: text.slice(0, 4096) });
}

const sessions = new Map<number, AgentSession>();

async function getSession(chatId: number): Promise<AgentSession> {
  let session = sessions.get(chatId);
  if (session) return session;
  const modelRuntime = await ModelRuntime.create();
  const loader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir: getAgentDir(),
    systemPromptOverride: buildSystemPrompt,
    additionalExtensionPaths: [
      new URL("../extensions/memory.ts", import.meta.url).pathname,
    ],
  });
  await loader.reload();
  const created = await createAgentSession({
    cwd: process.cwd(),
    modelRuntime,
    resourceLoader: loader,
    sessionManager: SessionManager.inMemory(process.cwd()),
  });
  session = created.session;
  sessions.set(chatId, session);
  return session;
}

async function main() {
  if (!process.env.TG_BOT_TOKEN) {
    console.error("set TG_BOT_TOKEN first");
    process.exit(1);
  }
  console.log(`${BRAND.name} gateway: telegram long-poll started`);
  let offset = 0;

  for (;;) {
    const updates = await tg("getUpdates", { timeout: 25, offset });
    if (!updates.ok || !updates.result) continue;
    for (const u of updates.result) {
      offset = u.update_id + 1;
      const msg = u.message?.text;
      const chatId = u.message?.chat?.id;
      if (!msg || !chatId) continue;

      try {
        const session = await getSession(chatId);
        let reply = "";
        session.subscribe((event) => {
          if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
            reply += event.assistantMessageEvent.delta;
          }
        });
        await session.prompt(msg);
        await send(chatId, reply || "(no output)");
      } catch (err) {
        await send(chatId, `error: ${(err as Error).message}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(`gateway fatal: ${err.message}`);
  process.exit(1);
});
