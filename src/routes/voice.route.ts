import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB
const router = express.Router();

/**
 * POST /api/voice/transcribe
 * form-data: file = audio file (mp3/wav/m4a)
 */
router.post("/transcribe", upload.single("file"), async (req, res) => {
  if (!(req as any).file) return res.status(400).json({ ok: false, error: "missing_file" });

  try {
    // This example uses OpenAI Whisper-compatible endpoint.
    // Ensure OPENAI_API_KEY is set in env. Change URL if using another provider.
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "missing_provider_key" });

    const form = new FormData();
    form.append("file", (req as any).file.buffer, { filename: (req as any).file.originalname });
    form.append("model", "whisper-1"); // change if your provider uses a different model name

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // NOTE: form.getHeaders() is not directly usable here in some environments; node-fetch handles it if passed
      } as any,
      body: form as any,
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ ok: false, error: "provider_error", details: text });
    }

    const json = await response.json();
    return res.json({ ok: true, transcription: json });
  } catch (err) {
    console.error("Voice transcribe error:", err);
    return res.status(500).json({ ok: false, error: "internal_error", message: (err as any)?.message });
  }
});

export default router;
