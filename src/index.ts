import express from "express";
import imageRoute from "./routes/image.route";
import voiceRoute from "./routes/voice.route";
import aiRoute from "./routes/ai.routes";

const PORT = Number(process.env.PORT || 5000);
const app = express();

app.use(express.json({ limit: "8mb" }));
// dev_request_logger_marker
// simple request logger (dev only)
app.use((req, _res, next) => {
  try {
    const safeBody = JSON.stringify((req as any).body || {}).slice(0, 1000);
    // eslint-disable-next-line no-console
    console.log(`[REQ] ${req.method} ${req.path} body_preview=${safeBody}`);
  } catch (e) {
    // ignore logging errors
  }
  next();
});
/** invalid_json_handler_added_marker
 * Return a clean 400 for invalid JSON bodies instead of noisy stack traces.
 */
app.use((err: any, _req: any, res: any, next: any) => {
  if (err && err.type === "entity.parse.failed") {
    // body-parser JSON parse error
    return res.status(400).json({ ok: false, error: "invalid_json", message: err.message });
  }
  return next(err);
});
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Mount Day8 routes
app.use("/api/image", imageRoute);
app.use("/api/voice", voiceRoute);

// Mount AI routes (v1)
app.use("/api/v1", aiRoute);

// Legacy simple chat echo endpoint (keeps prior behavior)
app.post("/api/v1/chat", async (req, res) => {
  try {
    const userMessage = req.body?.messages?.[0]?.content || req.body?.prompt || "no message";
    const providerResp = {
      provider: "orchestrator-echo",
      model: "echo-model",
      text: `Echo: ${String(userMessage).slice(0, 500)}`
    };
    return res.json({ ok: true, result: providerResp });
  } catch (err) {
    console.error("Legacy chat error:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Orchestrator listening on ${PORT}`);
});

export default app;


