import { NextRequest, NextResponse } from "next/server";

const MODEL_CANDIDATES = ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "llama-3.3-70b-versatile"];

function extractSuggestions(content: unknown): string[] {
  const text = String(content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "").trim();
  if (!text) return [];

  const candidates: unknown[] = [];
  try {
    candidates.push(JSON.parse(text));
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { candidates.push(JSON.parse(match[0])); } catch {}
    }
  }

  for (const candidate of candidates) {
    const values = Array.isArray(candidate)
      ? candidate
      : candidate && typeof candidate === "object"
        ? ((candidate as Record<string, unknown>).suggestions ?? (candidate as Record<string, unknown>).replies ?? [])
        : [];
    if (!Array.isArray(values)) continue;
    const suggestions = values.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 3);
    if (suggestions.length > 0) return suggestions;
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

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          cache: "no-store",
          body: JSON.stringify({
            model,
            temperature: 0.7,
            max_tokens: 120,
            messages: [
              { role: "system", content: "Return ONLY a JSON array of exactly 3 short natural replies to the friend's latest message. Match the language of the message. Maximum 8 words each." },
              ...messages.slice(-6),
            ],
          }),
        });

        const raw = await response.text();
        let data: any;
        try { data = JSON.parse(raw); } catch { data = { raw }; }

        if (!response.ok) {
          console.error("Groq suggestions failed", { model, status: response.status, error: data?.error ?? raw });
          continue;
        }

        const suggestions = extractSuggestions(data?.choices?.[0]?.message?.content);
        if (suggestions.length > 0) return NextResponse.json({ suggestions });
        console.error("Groq returned no parseable suggestions", { model, payload: data });
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
