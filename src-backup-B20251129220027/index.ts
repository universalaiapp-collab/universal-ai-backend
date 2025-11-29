import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const app = express();

/**
 * Minimal shims and helpers so this single file works standalone:
 * - logger
 * - metrics writer (mock)
 * - provider callers (mock when env keys missing, real if keys present)
 */

const logger = {
  info: (...args: any[]) => { try { console.info(...args); } catch {} },
  warn: (...args: any[]) => { try { console.warn(...args); } catch {} },
  error: (...args: any[]) => { try { console.error(...args); } catch {} },
};

async function writeMetric(payload: any) {
  try {
    console.log("[MetricsModel.create]", JSON.stringify({
      timestamp: payload.timestamp ?? new Date(),
      route: payload.route ?? null,
      provider: payload.provider ?? null,
      userId: payload.userId ?? null,
      durationMs: payload.durationMs ?? null,
      statusCode: payload.statusCode ?? null,
      errorMessage: payload.errorMessage ?? null,
      meta: payload.meta ?? null,
    }));
  } catch (e) {
    console.warn("writeMetric failed", e);
  }
}

type ChatMessage = { role: string; content: string; };

async function callOpenAIMockOrReal(messages: ChatMessage[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      provider: "openai",
      text: "[mock] OpenAI API key not set. Provide OPENAI_API_KEY in .env for real calls.",
      raw: null,
      usage: null,
    };
  }
  // real call (simple)
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const body = { model: "gpt-4o-mini", messages: messages.map(m => ({ role: m.role, content: m.content })) };
    const res = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      timeout: 30000,
    });
    const text = res?.data?.choices?.[0]?.message?.content ?? JSON.stringify(res.data);
    return { provider: "openai", text, raw: res.data, usage: res?.data?.usage ?? null };
  } catch (e: any) {
    throw e;
  }
}

async function callGeminiMockOrReal(messages: ChatMessage[]) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return {
      provider: "gemini",
      text: "[mock] Gemini API key not set. Provide GOOGLE_API_KEY in .env for real calls.",
      raw: null,
      usage: null,
    };
  }
  try {
    const model = process.env.GOOGLE_GEMINI_MODEL ?? "gemini-1.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateText`;
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const body = { prompt: { text: prompt }, maxOutputTokens: 800 };
    const res = await axios.post(endpoint, body, { params: { key }, timeout: 30000 });
    const text = res?.data?.candidates?.[0]?.output ?? res?.data?.candidates?.[0]?.content ?? JSON.stringify(res.data);
    return { provider: "gemini", text, raw: res.data, usage: null };
  } catch (e: any) {
    throw e;
  }
}

// Express middleware
app.use(express.json({ limit: "5mb", strict: true }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Debug logger to show parsed body
app.use((req: Request, _res: Response, next: NextFunction) => {
  try {
    const short = (() => {
      try {
        const s = JSON.stringify(req.body ?? {});
        return s.length > 2000 ? s.slice(0, 2000) + "...(truncated)" : s;
      } catch { return "[unserializable]"; }
    })();
    console.log("[DEBUG] incoming request:", req.method, req.url);
    console.log("[DEBUG] parsed body:", short);
  } catch (e) { console.warn("[DEBUG] middleware error", e); }
  next();
});

// Smart router: try openai then gemini
async function smartRoute(messages: ChatMessage[], userId: string) {
  const tried: string[] = [];
  const order = ["openai", "gemini"];
  for (const key of order) {
    tried.push(key);
    try {
      if (key === "openai") {
        const r = await callOpenAIMockOrReal(messages);
        await writeMetric({ timestamp: new Date(), route: "/api/v1/chat", provider: "openai", userId, durationMs: 0, statusCode: 200, errorMessage: null, meta: { tokens: r.usage ?? null, providerRaw: r.raw ?? null }});
        return { provider: "openai", text: r.text, tried };
      } else if (key === "gemini") {
        const r = await callGeminiMockOrReal(messages);
        await writeMetric({ timestamp: new Date(), route: "/api/v1/chat", provider: "gemini", userId, durationMs: 0, statusCode: 200, errorMessage: null, meta: { tokens: r.usage ?? null, providerRaw: r.raw ?? null }});
        return { provider: "gemini", text: r.text, tried };
      }
    } catch (e: any) {
      await writeMetric({ timestamp: new Date(), route: "/api/v1/chat", provider: key, userId, durationMs: null, statusCode: 500, errorMessage: String(e?.message ?? e), meta: { tried }});
      // try next
    }
  }
  throw new Error("All providers failed");
}

// Controller
app.post("/api/v1/chat", async (req: Request, res: Response) => {
  const start = Date.now();
  const userId = (req.header("x-user-id") || "anonymous").toString();
  try {
    const bodyMessages = req.body?.messages;
    if (!Array.isArray(bodyMessages) || bodyMessages.length === 0) {
      return res.status(400).json({ ok: false, error: "messages array required" });
    }
    // basic validation
    const validated: ChatMessage[] = bodyMessages.map((m: any, i: number) => {
      if (!m || typeof m !== "object") throw new Error(`messages[${i}] must be object`);
      const role = typeof m.role === "string" ? m.role : "user";
      const content = typeof m.content === "string" ? m.content.trim() : "";
      if (!content) throw new Error(`messages[${i}].content required`);
      if (content.length > 20000) throw new Error(`messages[${i}].content too large`);
      return { role, content };
    });

    const result = await smartRoute(validated, userId);
    // write success metric
    await writeMetric({ timestamp: new Date(), route: "/api/v1/chat", provider: result.provider, userId, durationMs: Date.now() - start, statusCode: 200, errorMessage: null, meta: { tried: result.tried }});
    return res.status(200).json({ ok: true, result });
  } catch (err: any) {
    await writeMetric({ timestamp: new Date(), route: "/api/v1/chat", provider: null, userId, durationMs: Date.now() - start, statusCode: 500, errorMessage: String(err?.message ?? err), meta: {}});
    const message = String(err?.message ?? "internal_error");
    return res.status(500).json({ ok: false, error: message });
  }
});

// Health route
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// JSON parse error handler
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }
  next(err);
});

// Generic error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error", err);
  res.status(err?.status || 500).json({ ok: false, error: err?.message ?? "internal_error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Orchestrator listening on ${PORT}`);
});
