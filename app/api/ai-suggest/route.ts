import { NextRequest, NextResponse } from "next/server";

const MODEL_CANDIDATES = ["openai/gpt-oss-20b", "openai/gpt-oss-120b"];

function extractSuggestions(raw: unknown): string[] {
  const text = String(raw ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "").trim();
  if (!text) return [];
  const possible: unknown[] = [];
  try { possible.push(JSON.parse(text)); } catch {
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) { try { possible.push(JSON.parse(match[0])); } catch {} }
  }
  for (const value of possible) {
    const arr = Array.isArray(value) ? value : value && typeof value === "object"
      ? ((value as Record<string, unknown>).suggestions ?? (value as Record<string, unknown>).replies ?? []) : [];
    if (!Array.isArray(arr)) continue;
    const suggestions = arr.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 3);
    if (suggestions.length > 0) return suggestions;
  }
  return [];
}

function localFallback(messages: any[]): string[] {
  const latest = messages[messages.length - 1]?.content?.trim();
  if (!latest || latest === "[shared an image]") return ["nice pic! 😍", "wow kya cheez hai!", "aur bhejo 👀"];
  return [`acha, phir kya hua?`, `waah, ye interesting hai 😄`, `sach mein? batao na!`];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey || messages.length === 0) return NextResponse.json({ suggestions: [] });

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          cache: "no-store",
          body: JSON.stringify({
            model,
            temperature: 0.4,
            max_tokens: 160,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "Return only JSON: {\"suggestions\":[\"reply 1\",\"reply 2\",\"reply 3\"]}. Keep each reply under 8 words and match the user's language." },
              ...messages.slice(-6),
            ],
          }),
        });
        const raw = await response.text();
        let data: any;
        try { data = JSON.parse(raw); } catch { data = { raw }; }
        if (!response.ok) { console.error("Groq suggestions failed", { model, status: response.status, error: data?.error ?? raw }); continue; }
        const suggestions = extractSuggestions(data?.choices?.[0]?.message?.content);
        if (suggestions.length > 0) return NextResponse.json({ suggestions });
        console.error("Groq returned no parseable suggestions", { model, message: data?.choices?.[0]?.message, raw });
      } catch (error) { console.error("Groq request error", { model, error }); }
    }

    // Keep the UI useful even if Groq returns an unexpected format.
    return NextResponse.json({ suggestions: localFallback(messages) });
  } catch (error) {
    console.error("AI suggestion route error", error);
    return NextResponse.json({ suggestions: [] });
  }
}
