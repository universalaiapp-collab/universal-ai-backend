// src/controllers/orch.controller.ts
import { Request, Response, NextFunction } from "express";
import { smartRoute } from "../engine/router";
import { writeMetric } from "../lib/metrics"; // adapt path if needed
import { logger } from "../lib/logger"; // optional, adapt or remove if you don't have a logger

type ChatMessage = {
  role: "system" | "user" | "assistant" | string;
  content: string;
};

/**
 * POST /api/v1/chat
 * Body: { messages: ChatMessage[] }
 */
export async function postChatHandler(req: Request, res: Response, next: NextFunction) {
  const startTs = Date.now();
  const userId = (req.header("x-user-id") || "anonymous").toString();

  try {
    const body = req.body ?? {};
    const bodyMessages = body.messages;

    // Basic shape validation
    if (!Array.isArray(bodyMessages) || bodyMessages.length === 0) {
      return res.status(400).json({ ok: false, error: "messages array required" });
    }

    // Validate each message shape & lengths
    const validatedMessages: ChatMessage[] = [];
    for (let i = 0; i < bodyMessages.length; i++) {
      const m = bodyMessages[i];
      if (!m || typeof m !== "object") {
        return res.status(400).json({ ok: false, error: `messages[${i}] must be an object` });
      }
      const role = typeof m.role === "string" ? m.role : "user";
      const content = typeof m.content === "string" ? m.content.trim() : "";
      if (!content) {
        return res.status(400).json({ ok: false, error: `messages[${i}].content required` });
      }
      // Prevent huge single-message payloads (safety)
      if (content.length > 20000) {
        return res.status(413).json({ ok: false, error: `messages[${i}].content too large` });
      }
      validatedMessages.push({ role, content });
    }

    // Global size guard: too many messages
    if (validatedMessages.length > 80) {
      return res.status(413).json({ ok: false, error: "messages array too large" });
    }

    // Call smart router -> returns { provider, text, tried, ... }
    const result = await smartRoute(validatedMessages, userId);

    // write success metric (best-effort)
    try {
      await writeMetric?.({
        timestamp: new Date(),
        route: "/api/v1/chat",
        provider: result?.provider ?? null,
        userId,
        durationMs: Date.now() - startTs,
        statusCode: 200,
        errorMessage: null,
        meta: { tried: result?.tried ?? null },
      });
    } catch (mErr) {
      // metric write should not block response
      // eslint-disable-next-line no-console
      console.warn("metric write failed", mErr);
    }

    return res.status(200).json({ ok: true, result });
  } catch (err: any) {
    const durationMs = Date.now() - startTs;
    const message = String(err?.message ?? err ?? "unknown_error");

    // write error metric (best-effort)
    try {
      await writeMetric?.({
        timestamp: new Date(),
        route: "/api/v1/chat",
        provider: null,
        userId,
        durationMs,
        statusCode: 500,
        errorMessage: message,
        meta: { stack: err?.stack ?? null },
      });
    } catch (mErr) {
      // ignore
      // eslint-disable-next-line no-console
      console.warn("metric write failed", mErr);
    }

    // optional logger usage if you have one
    try {
      logger?.error?.({
        msg: "postChatHandler error",
        userId,
        route: "/api/v1/chat",
        error: message,
        stack: err?.stack,
      });
    } catch {}

    return res.status(500).json({ ok: false, error: message });
  }
}
