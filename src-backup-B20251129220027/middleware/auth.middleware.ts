// src/middleware/auth.middleware.ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import Wallet from "../models/wallet.model";

type Tier = "FREE" | "PAID" | "PRO";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const DEFAULT_TIERS: Record<Tier, { dailyLimit: number; maxTokens: number }> = {
  FREE: { dailyLimit: 2000, maxTokens: 2000 },
  PAID: { dailyLimit: 20000, maxTokens: 16000 },
  PRO: { dailyLimit: 100000, maxTokens: 65536 },
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    let payload: any = null;

    if (header && header.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
      } catch (err) {
        return res.status(401).json({ msg: "Invalid token" });
      }
    }

    if (!payload && process.env.NODE_ENV !== "production") {
      req.user = {
        id: "dev-user-id",
        name: "Dev User",
        email: "dev@local",
        tier: "PRO",
        dailyLimit: DEFAULT_TIERS.PRO.dailyLimit,
        maxPromptTokens: DEFAULT_TIERS.PRO.maxTokens,
        maxTokensPerRequest: DEFAULT_TIERS.PRO.maxTokens,
        role: "admin",
        isDev: true,
      };
      return next();
    }

    if (!payload) return res.status(401).json({ msg: "No token provided" });

    const userId = (payload as any).id;
    const user = await User.findById(userId).lean();

    let tier: Tier = "FREE";
    if (user && (user as any).tier) tier = (user as any).tier as Tier;
    else if (user) tier = "FREE";

    const tierMeta = DEFAULT_TIERS[tier];

    req.user = {
      id: user ? user._id.toString() : userId,
      name: user ? (user as any).name : undefined,
      email: user ? (user as any).email : undefined,
      tier,
      dailyLimit: tierMeta.dailyLimit,
      maxPromptTokens: tierMeta.maxTokens,
      maxTokensPerRequest: tierMeta.maxTokens,
      role: user ? (user as any).role || "user" : "user",
      isDev: false,
    };

    try {
      const wallet = await (Wallet as any).findOne({ userId: req.user.id }).lean();
      if (wallet) req.user.wallet = { credits: (wallet as any).credits };
    } catch { /* ignore wallet errors */ }

    next();
  } catch (err) {
    console.error("AuthMiddleware Error:", err);
    return res.status(500).json({ msg: "Auth error" });
  }
};

export default authMiddleware;

