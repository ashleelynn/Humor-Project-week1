// Server-only: reads GEMINI_API_KEY. Never import this from a client component.
import { MOODS, isMood, MAX_LENGTH, type MoodId } from "./confessions";
import { CAPTIONS_PER_DROP } from "./photo-booth";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

// Errors with a message that's safe to show the person who dropped the photo.
export class BoothAIError extends Error {}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    alt: { type: "string" },
    captions: {
      type: "array",
      minItems: CAPTIONS_PER_DROP,
      maxItems: CAPTIONS_PER_DROP,
      items: {
        type: "object",
        properties: {
          mood: { type: "string", enum: MOODS.map((m) => m.id) },
          text: { type: "string" },
        },
        required: ["mood", "text"],
      },
    },
  },
  required: ["alt", "captions"],
};

const SAFETY_STOPS = ["SAFETY", "IMAGE_SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"];

type GenerateContentResponse = {
  promptFeedback?: { blockReason?: string };
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

export async function writeCaptions({ image, mimeType, prompt }: { image: ArrayBuffer; mimeType: string; prompt: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new BoothAIError("The booth's AI isn't plugged in yet: GEMINI_API_KEY is missing on the server.");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data: Buffer.from(image).toString("base64") } }, { text: prompt }],
          },
        ],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: RESPONSE_SCHEMA },
      }),
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
  } catch (e) {
    console.error("Gemini request failed", e);
    throw new BoothAIError("The booth's AI took too long. Try again in a moment.");
  }

  if (!res.ok) {
    console.error(`Gemini ${model} answered ${res.status}`, await res.text());
    if (res.status === 429) throw new BoothAIError("The booth's AI is catching its breath. Try again in a minute.");
    if (res.status === 400 || res.status === 403) {
      throw new BoothAIError(`Gemini turned the request down (${res.status}). Check GEMINI_API_KEY and GEMINI_MODEL.`);
    }
    throw new BoothAIError(`Gemini is having a moment (${res.status}). Try again.`);
  }

  const data = (await res.json()) as GenerateContentResponse;
  const candidate = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || SAFETY_STOPS.includes(candidate?.finishReason ?? "")) {
    throw new BoothAIError("The booth won't caption that one. Try a different photo.");
  }

  const text = candidate?.content?.parts?.find((p) => !p.thought && p.text)?.text ?? "";
  let parsed: { alt?: string; captions?: { mood?: string; text?: string }[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Gemini sent back something that isn't JSON", text);
    throw new BoothAIError("The booth's AI mumbled. Try again.");
  }

  const captions = (parsed.captions ?? [])
    .map((c) => ({ mood: c.mood ?? "", body: (c.text ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH) }))
    .filter((c): c is { mood: MoodId; body: string } => isMood(c.mood) && c.body.length > 0)
    .slice(0, CAPTIONS_PER_DROP);
  if (captions.length < CAPTIONS_PER_DROP) {
    console.error("Gemini returned too few usable captions", text);
    throw new BoothAIError("The booth's AI mumbled. Try again.");
  }

  const altText = (parsed.alt ?? "").replace(/\s+/g, " ").trim().slice(0, 300) || null;
  return { model, altText, captions };
}
