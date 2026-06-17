import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        suggestions: ["Sounds good! 👍", "Tell me more", "That's interesting!"],
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 100,
          messages: [
            {
              role: "system",
              content: `You are a smart reply suggestion assistant for a chat app.
The conversation below shows messages between two people.
Messages with role "assistant" are sent BY THE USER (me).
Messages with role "user" are sent BY THE OTHER PERSON (friend).
Your job: suggest 3 short replies that I should send in response to my friend's LAST message.
Rules:
- Each reply max 6 words
- Detect the language of the friend's last message and reply in THAT EXACT language
- If Roman Urdu → Roman Urdu replies
- If English → English replies
- If Urdu script → Urdu script replies
- If Hinglish → Hinglish replies
- Return ONLY a JSON array of 3 strings, nothing else
- Example: ["Theek hai yaar!", "Aa raha hoon", "Bilkul sahi"]`,
            },
            ...messages,
            {
              role: "user",
              content: "Give me 3 replies I should send. JSON array only.",
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleaned);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("AI suggest error:", err);
    return NextResponse.json({
      suggestions: ["Sounds good!", "Tell me more", "👍"],
    });
  }
}