import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";

type ChatMessage = { role?: string; content?: string; text?: string };

function getGroqKeys(): string[] {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
  ].filter((key): key is string => Boolean(key?.trim())).map((key) => key.trim());
}

function unique(values: unknown[]): string[] {
  const seen = new Set<string>();
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function parseSuggestions(value: unknown): string[] {
  const text = String(value ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  if (!text) return [];

  const candidates: unknown[] = [];
  try {
    candidates.push(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try { candidates.push(JSON.parse(match[0])); } catch { /* ignore */ }
    }
  }

  for (const candidate of candidates) {
    const values = Array.isArray(candidate)
      ? candidate
      : candidate && typeof candidate === "object"
        ? ((candidate as Record<string, unknown>).suggestions ?? (candidate as Record<string, unknown>).replies ?? [])
        : [];
    const result = Array.isArray(values) ? unique(values) : [];
    if (result.length) return result;
  }
  return [];
}

function fallback(history: ChatMessage[]): string[] {
  const latest = String(history.at(-1)?.content ?? history.at(-1)?.text ?? "").trim();
  if (!latest || latest === "[image]") return ["Kya hua?", "Nice picture 😍", "Aur bhejo!"];
  if (latest.includes("?")) return ["Haan bilkul", "Main check karta hoon", "Tum kya sochte ho?"];
  return ["Acha, phir batao", "Haan samajh gaya", "Ye interesting hai 😄"];
}

function rotate<T>(items: T[], start: number): T[] {
  return items.slice(start).concat(items.slice(0, start));
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST to get smart suggestions.",
    configuredKeys: getGroqKeys().length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = Array.isArray(body?.messages) ? body.messages : [];
    const history: ChatMessage[] = input.slice(-20).map((message: ChatMessage) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content ?? message.text ?? "[image]").slice(0, 1000),
    }));

    if (!history.length) return NextResponse.json({ suggestions: [] });

    const keys = getGroqKeys();
    if (!keys.length) {
      console.error("AI suggestions: no GROQ_API_KEY variables configured");
      return NextResponse.json({ suggestions: fallback(history), source: "fallback" });
    }

    const baseUrl = (process.env.GROQ_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    // Random start spreads requests across all configured keys. Failed keys are retried last.
    const orderedKeys = rotate(keys, Math.floor(Math.random() * keys.length));

    for (const apiKey of orderedKeys) {
      try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          cache: "no-store",
          body: JSON.stringify({
            model,
            temperature: 0.85,
            top_p: 0.95,
            max_tokens: 220,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Read the recent conversation carefully. Reply to the latest friend message, not earlier messages. Return exactly three different, natural, context-specific short replies. Match the conversation language (English, Roman Urdu, Urdu, or Hinglish). Do not use generic filler. Each reply must be under 12 words. Return only valid JSON: {\"suggestions\":[\"reply 1\",\"reply 2\",\"reply 3\"]}.",
              },
              ...history,
            ],
          }),
        });

        const raw = await response.text();
        let data: any;
        try { data = JSON.parse(raw); } catch { data = null; }

        if (!response.ok) {
          console.error("Groq key request failed", { status: response.status, error: data?.error ?? raw });
          continue;
        }

        const message = data?.choices?.[0]?.message;
        const suggestions = parseSuggestions(message?.content ?? message?.reasoning);
        if (suggestions.length) {
          return NextResponse.json({ suggestions, source: "groq" });
        }
      } catch (error) {
        console.error("Groq request error", error);
      }
    }

    return NextResponse.json({ suggestions: fallback(history), source: "fallback" });
  } catch (error) {
    console.error("AI suggestion route error", error);
    return NextResponse.json({ suggestions: [] });
  }
}
