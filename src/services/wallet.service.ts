// src/services/wallet.service.ts
import WalletModel from '../models/wallet.model';
import mongoose from 'mongoose';

export async function getWalletByUserId(userId: string) {
  return WalletModel.findOne({ userId }).lean();
}

export async function createOrGetWallet(userId: string, initialCredits = 0) {
  const existing = await WalletModel.findOne({ userId });
  if (existing) return existing;
  return WalletModel.create({ userId, credits: initialCredits, reserved: 0 });
}

/**
 * reserveCredits: atomically reduce available credits and increase reserved.
 * This attempts a single-document transaction via findOneAndUpdate.
 */
export async function reserveCredits(userId: string, amount: number) {
  if (amount <= 0) return { success: true };
  const res = await WalletModel.findOneAndUpdate(
    { userId, credits: { $gte: amount } },
    { $inc: { credits: -amount, reserved: amount } },
    { new: true }
  ).lean();
  if (!res) {
    return { success: false, message: 'insufficient_credits' };
  }
  return { success: true, wallet: res };
}

export async function finalizeDeduction(userId: string, amount: number, meta: any = {}) {
  if (amount <= 0) return;
  // decrement reserved by amount and add ledger entry
  const res = await WalletModel.findOneAndUpdate(
    { userId, reserved: { $gte: amount } },
    {
      $inc: { reserved: -amount },
      $push: { ledger: { amount: -amount, reason: 'usage', at: new Date(), meta } }
    },
    { new: true }
  );
  return res;
}

export async function refundReserved(userId: string, amount: number, reason = 'refund') {
  if (amount <= 0) return;
  const res = await WalletModel.findOneAndUpdate(
    { userId, reserved: { $gte: amount } },
    { $inc: { reserved: -amount, credits: amount }, $push: { ledger: { amount, reason, at: new Date() } } },
    { new: true }
  );
  return res;
}
