// src/services/wallet.service.ts
// Wallet service that uses the in-memory WalletModel for local dev.
// Use direct await on model calls (no .lean()) to satisfy TypeScript.

import WalletModel from "../models/wallet.model";

export type WalletDoc = {
  _id: string;
  userId?: string;
  credits?: number;
  reserved?: number;
  [k: string]: any;
};

/**
 * Get wallet by userId (returns null if not found)
 */
export async function getWalletByUserId(userId: string): Promise<WalletDoc | null> {
  if (!userId) return null;
  const w = await WalletModel.findOne({ userId });
  return w ?? null;
}

/**
 * Create a wallet for a user if it doesn't exist
 */
export async function createWalletIfNotExists(userId: string, initialCredits = 0): Promise<WalletDoc> {
  let wallet = await WalletModel.findOne({ userId });
  if (wallet) return wallet;
  wallet = await WalletModel.create({ userId, credits: initialCredits, reserved: 0 });
  return wallet;
}

/**
 * Reserve credits for a request (decrement available credits and increment reserved).
 * Returns the updated wallet or null if insufficient credits.
 */
export async function reserveCredits(userId: string, amount: number): Promise<WalletDoc | null> {
  // find wallet with enough credits (supporting operator queries via our model)
  const wallet = await WalletModel.findOne({ userId, credits: { $gte: amount } });
  if (!wallet) return null;

  const updated = await WalletModel.findOneAndUpdate(
    { _id: wallet._id },
    { credits: (wallet.credits ?? 0) - amount, reserved: (wallet.reserved ?? 0) + amount },
    { new: true }
  );
  return updated;
}

/**
 * Finalize charge: subtract reserved and save (reserved already subtracted from credits when reserving).
 * 'amount' is the finalized amount to remove from reserved (could be equal to reserved).
 */
export async function finalizeCharge(userId: string, amount: number): Promise<WalletDoc | null> {
  const wallet = await WalletModel.findOne({ userId, reserved: { $gte: amount } });
  if (!wallet) return null;

  const updated = await WalletModel.findOneAndUpdate(
    { _id: wallet._id },
    { reserved: (wallet.reserved ?? 0) - amount },
    { new: true }
  );
  return updated;
}

/**
 * Refund reserved credits back to available credits (used when provider fails)
 */
export async function refundReserved(userId: string, amount: number): Promise<WalletDoc | null> {
  const wallet = await WalletModel.findOne({ userId, reserved: { $gte: amount } });
  if (!wallet) return null;

  const updated = await WalletModel.findOneAndUpdate(
    { _id: wallet._id },
    { reserved: (wallet.reserved ?? 0) - amount, credits: (wallet.credits ?? 0) + amount },
    { new: true }
  );
  return updated;
}
