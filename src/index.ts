/**
 * Minimal TypeScript server (Day-7 reset)
 * - GET /health -> { ok: true }
 * - POST /api/v1/chat -> echoes message back
 * Built only with Node builtins to avoid missing type packages.
 */
import http from 'http';
import { URL } from 'url';

const PORT = Number(process.env.PORT || 4000);

function sendJSON(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body).toString()
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '', http://);
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJSON(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/chat') {
      // collect body
      let raw = '';
      for await (const chunk of req) { raw += chunk; }
      let body: any = {};
      try { body = JSON.parse(raw || '{}'); } catch { body = {}; }
      const userMessage = body?.messages?.[0]?.content || 'no message';
      // call provider stub
      const providerResp = {
        provider: 'openai-stub',
        model: 'gpt-stub',
        text: Echo: 
      };
      sendJSON(res, 200, { ok: true, result: providerResp });
      return;
    }

    // Not found
    sendJSON(res, 404, { ok: false, message: 'not found' });
  } catch (err) {
    sendJSON(res, 500, { ok: false, error: String(err) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(Orchestrator listening on );
});
