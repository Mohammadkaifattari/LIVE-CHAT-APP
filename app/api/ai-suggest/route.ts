import { NextRequest, NextResponse } from "next/server";

const MODEL_CANDIDATES = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama-3.3-70b-versatile",
];

function normalizeSuggestions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 3);
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const list = Array.isArray(obj.suggestions) ? obj.suggestions : Array.isArray(obj.replies) ? obj.replies : [];
    return list.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 3);
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is missing");
      return NextResponse.json({ suggestions: [] });
    }

    const promptMessages = [
      {
        role: "system",
        content: `You are a witty, natural smart reply assistant for a casual chat app.
Messages with role "assistant" = sent by ME. Messages with role "user" = sent by MY FRIEND.
Suggest 3 VERY DIFFERENT reply options for my friend's LAST message only.

Rules:
- Make each reply feel DIFFERENT in tone: one casual, one funny, one thoughtful
- Max 8 words each
- NEVER use generic replies like "Sounds good", "Tell me more", "That's interesting", "Asalamualikum" unless friend literally said salam
- Replies must be SPECIFIC to what the friend actually said or sent
- Match the language exactly: Roman Urdu → Roman Urdu, English → English, Urdu → Urdu, Hinglish → Hinglish
- Add emojis only when natural
- If friend's last message is [shared an image]: suggest reactions to seeing an image e.g. ["nice pic! 😍", "wow kya cheez hai!", "aur bhejo 👀"]
- If friend's last message is text AFTER an image: focus ONLY on that text, ignore the image
- NEVER suggest greetings unless friend's last message IS a greeting
- Return ONLY a JSON array of 3 strings, nothing else
- Good (friend said "ye billi kasi he"): ["bohot cute hai yaar 😍", "teri he kya?", "naam kya rakha 😂"]`,
      },
      ...(Array.isArray(messages) ? messages : []),
      { role: "user", content: "Give me 3 replies I should send. JSON array only." },
    ];

    let lastError = "";

    for (const model of MODEL_CANDIDATES) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, temperature: 0.8, max_tokens: 120, messages: promptMessages }),
        });

        if (!response.ok) {
          lastError = `model=${model} status=${response.status} body=${await response.text()}`;
          console.error("AI suggest failed:", lastError);
          continue;
        }

        const data = await response.json();
        const text = String(data.choices?.[0]?.message?.content ?? "[]").replace(/```json|```/gi, "").trim();

        try {
          const suggestions = normalizeSuggestions(JSON.parse(text));
          if (suggestions.length > 0) return NextResponse.json({ suggestions });
        } catch (parseError) {
          console.error("AI suggest parse error:", model, parseError, text);
        }
      } catch (error) {
        lastError = `model=${model} error=${String(error)}`;
        console.error("AI suggest request error:", lastError);
      }
    }

    console.error("All Groq model attempts failed:", lastError);
    return NextResponse.json({ suggestions: [] });
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
