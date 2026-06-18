import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ suggestions: [] });
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
          max_tokens: 150,
          messages: [
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
- Bad: ["Sounds good!", "Tell me more", "That's interesting"]
- Good (friend said "ye billi kasi he"): ["bohot cute hai yaar 😍", "teri he kya?", "naam kya rakha 😂"]`,
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
    return NextResponse.json({ suggestions: [] });
  }
}