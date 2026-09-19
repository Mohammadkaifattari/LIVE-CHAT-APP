import { NextRequest, NextResponse } from "next/server";

const MODEL_CANDIDATES = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];

function extractSuggestions(content: unknown): string[] {
  const text = String(content ?? "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  const candidates: unknown[] = [];
  try {
    candidates.push(JSON.parse(text));
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        candidates.push(JSON.parse(match[0]));
      } catch {
        // Try the next response format.
      }
    }
  }

  for (const candidate of candidates) {
    const values = Array.isArray(candidate)
      ? candidate
      : candidate && typeof candidate === "object"
        ? ((candidate as Record<string, unknown>).suggestions ?? (candidate as Record<string, unknown>).replies)
        : [];

    if (Array.isArray(values)) {
      const suggestions = values
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, 3);
      if (suggestions.length) return suggestions;
    }
  }

  return [];
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

    const promptMessages = [
      {
        role: "system",
        content: "Generate exactly 3 short, natural replies to the friend's latest message. Match the friend's language (English, Roman Urdu, Urdu, or Hinglish). Maximum 8 words each. Return ONLY a JSON array of 3 strings, for example [\"reply one\", \"reply two\", \"reply three\"].",
      },
      ...messages.slice(-6),
    ];

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 120,
            messages: promptMessages,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error("Groq suggestions failed", { model, status: response.status, error: data?.error });
          continue;
        }

        const suggestions = extractSuggestions(data?.choices?.[0]?.message?.content);
        if (suggestions.length) return NextResponse.json({ suggestions });
        console.error("Groq returned no parseable suggestions", { model, content: data?.choices?.[0]?.message?.content });
      } catch (error) {
        console.error("Groq request error", { model, error });
      }
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error) {
    console.error("AI suggestion route error", error);
    return NextResponse.json({ suggestions: [] });
  }
}
