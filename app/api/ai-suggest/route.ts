import { NextRequest, NextResponse } from "next/server";

const MODEL_CANDIDATES = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];

function normalizeSuggestions(list: unknown[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of list) {
    if (typeof item !== "string") continue;
    const clean = item.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(clean);
  }

  return unique.slice(0, 3);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function extractSuggestions(raw: unknown): string[] {
  const text = String(raw ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  if (!text) return [];

  const possible: unknown[] = [];

  try {
    possible.push(JSON.parse(text));
  } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        possible.push(JSON.parse(match[0]));
      } catch {
        // ignore parse failure
      }
    }
  }

  for (const value of possible) {
    const arr = Array.isArray(value)
      ? value
      : value && typeof value === "object"
        ? ((value as Record<string, unknown>).suggestions ?? (value as Record<string, unknown>).replies ?? [])
        : [];

    if (!Array.isArray(arr)) continue;

    const suggestions = arr
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, 3);

    if (suggestions.length > 0) return suggestions;
  }

  return [];
}

function localFallback(messages: any[]): string[] {
  const latest = messages[messages.length - 1];
  const lastText = latest?.text?.trim();

  if (!lastText || lastText === "[shared an image]") {
    return ["nice pic! 😍", "wow kya cheez hai!", "aur bhejo 👀"];
  }

  if (lastText.length < 12) {
    return ["ye to mast hai 😄", "waah, zabardast!", "aur batao na 😅"];
  }

  return ["yeh to bilkul sahi hai 😄", "interesting, aur batao", "kya scene hai yaar? 😏"];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey || messages.length === 0) {
      console.error("AI suggestions unavailable: missing key or messages");
      return NextResponse.json({ suggestions: [] });
    }

    const history = messages.slice(-20);

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          cache: "no-store",
          body: JSON.stringify({
            model,
            temperature: 0.8,
            top_p: 0.9,
            max_tokens: 180,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Use the full recent conversation history to understand tone, context, and relationships. Generate exactly 3 short, natural replies to the friend's latest message only. Match language (English, Urdu, Roman Urdu, Hinglish). Keep each reply short, under 8 words, specific to the conversation, and return only JSON: {\"suggestions\":[\"reply 1\",\"reply 2\",\"reply 3\"]}.",
              },
              ...history,
            ],
          }),
        });

        const raw = await response.text();
        let data: any = null;

        try {
          data = JSON.parse(raw);
        } catch {
          data = { raw };
        }

        if (!response.ok) {
          console.error("Groq suggestions failed", {
            model,
            status: response.status,
            error: data?.error ?? raw,
          });
          continue;
        }

        const directSuggestions = extractSuggestions(data?.choices?.[0]?.message?.content);
        const combined = shuffle([...directSuggestions, ...localFallback(history)]);
        const suggestions = normalizeSuggestions(combined);

        if (suggestions.length > 0) {
          return NextResponse.json({ suggestions });
        }

        console.error("Groq returned no parseable suggestions", {
          model,
          message: data?.choices?.[0]?.message,
          raw,
        });
      } catch (error) {
        console.error("Groq request error", { model, error });
      }
    }

    return NextResponse.json({ suggestions: normalizeSuggestions(localFallback(history)) });
  } catch (error) {
    console.error("AI suggestion route error", error);
    return NextResponse.json({ suggestions: [] });
  }
}
