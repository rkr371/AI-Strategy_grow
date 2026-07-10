import { Router } from "express";

const router = Router();

const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam – premade voice
const MODELS = ["eleven_turbo_v2_5", "eleven_flash_v2_5", "eleven_turbo_v2"];

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/gs, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .replace(/^[-=]{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function tryElevenLabs(
  apiKey: string,
  vid: string,
  cleanText: string,
  modelIndex = 0
): Promise<{ ok: true; buffer: ArrayBuffer } | { ok: false; status: number; err: string }> {
  if (modelIndex >= MODELS.length) {
    return { ok: false, status: 502, err: "All models exhausted" };
  }
  const model = MODELS[modelIndex];
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${vid}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: model,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.75,
          style: 0.25,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!upstream.ok) {
    const errText = await upstream.text();
    // If model-related error, try next model
    if (upstream.status === 401 || upstream.status === 422) {
      return tryElevenLabs(apiKey, vid, cleanText, modelIndex + 1);
    }
    return { ok: false, status: upstream.status, err: errText };
  }

  const buffer = await upstream.arrayBuffer();
  return { ok: true, buffer };
}

router.post("/voice/speak", async (req, res) => {
  const { text, voiceId } = req.body as { text?: string; voiceId?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY not configured" });
    return;
  }

  const vid = voiceId ?? DEFAULT_VOICE_ID;
  const cleanText = stripMarkdownForSpeech(text).slice(0, 5000);

  try {
    const result = await tryElevenLabs(apiKey, vid, cleanText);

    if (!result.ok) {
      req.log.error({ status: result.status, err: result.err }, "ElevenLabs error");
      res.status(502).json({ error: "Voice generation failed", detail: result.err });
      return;
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(result.buffer));
  } catch (err) {
    req.log.error({ err }, "Voice generation error");
    res.status(500).json({ error: "Voice generation failed" });
  }
});

router.get("/voice/voices", async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ELEVENLABS_API_KEY not configured" });
    return;
  }

  try {
    const upstream = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    const data = (await upstream.json()) as {
      voices: { voice_id: string; name: string }[];
    };
    const voices = (data.voices ?? []).map((v) => ({
      id: v.voice_id,
      name: v.name,
    }));
    res.json(voices);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch voices");
    res.status(500).json({ error: "Failed to fetch voices" });
  }
});

export default router;
