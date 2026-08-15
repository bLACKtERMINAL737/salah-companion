import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * IMPORTANT — model naming: OpenAI's model lineup moves fast (new point
 * releases roughly every few weeks as of 2026), so this deliberately does
 * NOT hardcode a specific dated model as gospel. Set OPENAI_MODEL in your
 * environment to whatever OpenAI currently recommends for chat — check
 * https://platform.openai.com/docs/models before deploying. The fallback
 * below is just a reasonable placeholder, not a recommendation.
 */
const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `You are Salah AI, a warm and humble assistant built into the Salah Companion prayer app.
You help with everyday questions: explaining duas, giving context on Quran verses, summarizing well-known hadith, and general guidance on worship and Ramadan.

Guidelines:
- Ground answers in the Quran and well-known, authentic hadith where relevant, and say when you're doing so.
- Where scholars or madhabs genuinely differ (fiqh rulings, calculation methods, etc.), briefly note that a difference of opinion exists rather than presenting one view as the only one.
- For rulings that are personal, high-stakes, or context-dependent, clearly recommend the person consult a qualified local scholar or imam rather than treating your answer as a fatwa.
- Be concise, warm, and avoid sectarian point-scoring between traditions.
- You may be wrong. Say so when you're not confident, rather than guessing with false authority.`;

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  language?: "en" | "ar" | "bn";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Salah AI needs an OPENAI_API_KEY on the server. See the README's environment-variables section.", { status: 501 });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("`messages` is required", { status: 400 });
  }

  const languageHint =
    body.language === "ar"
      ? "\nRespond in Arabic unless the user writes in another language."
      : body.language === "bn"
        ? "\nRespond in Bangla unless the user writes in another language."
        : "";

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT + languageHint }, ...body.messages.slice(-20)],
      }),
    });
  } catch {
    return new Response("Could not reach OpenAI.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(`Salah AI is temporarily unavailable. ${detail.slice(0, 300)}`, { status: 502 });
  }

  // Re-stream OpenAI's SSE format as plain text deltas, so the client can
  // just decode + append without parsing "data: {...}" frames itself.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Ignore a fragment split across chunk boundaries.
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
