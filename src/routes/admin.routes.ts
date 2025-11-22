// src/routes/admin.routes.ts
import express from 'express';
import * as metricsService from '../services/metrics.service';
import WalletModel from '../models/wallet.model';

const router = express.Router();

function adminGuard(req: any, res: any, next: any) {
  const user = req.user;
  const apiKey = req.headers['x-admin-api-key'];
  if ((user && user.role === 'admin') || apiKey === process.env.ADMIN_API_KEY) return next();
  return res.status(403).json({ ok: false, message: 'forbidden' });
}

router.use(adminGuard);

router.get('/admin/metrics', async (req, res) => {
  const q: any = {};
  if (req.query.userId) q.userId = req.query.userId;
  const rows = await metricsService.queryMetrics(q, 200);
  res.json({ ok: true, count: rows.length, rows });
});

router.get('/admin/wallets/:userId', async (req, res) => {
  const w = await WalletModel.findOne({ userId: req.params.userId }).lean();
  if (!w) return res.status(404).json({ ok: false });
  return res.json({ ok: true, wallet: w });
});

router.get('/admin/circuit-breakers', async (req, res) => {
  // simple placeholder: list of providers and manual CB states may be stored in DB later.
  return res.json({ ok: true, cb: { openai: { failures: 0 }, gemini: { failures: 0 } } });
});

export default router;
