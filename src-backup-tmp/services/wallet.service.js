"use strict";
// src/services/wallet.service.ts
// Wallet service that uses the in-memory WalletModel for local dev.
// Use direct await on model calls (no .lean()) to satisfy TypeScript.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletByUserId = getWalletByUserId;
exports.createWalletIfNotExists = createWalletIfNotExists;
exports.reserveCredits = reserveCredits;
exports.finalizeCharge = finalizeCharge;
exports.refundReserved = refundReserved;
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
/**
 * Get wallet by userId (returns null if not found)
 */
async function getWalletByUserId(userId) {
    if (!userId)
        return null;
    const w = await wallet_model_1.default.findOne({ userId });
    return w ?? null;
}
/**
 * Create a wallet for a user if it doesn't exist
 */
async function createWalletIfNotExists(userId, initialCredits = 0) {
    let wallet = await wallet_model_1.default.findOne({ userId });
    if (wallet)
        return wallet;
    wallet = await wallet_model_1.default.create({ userId, credits: initialCredits, reserved: 0 });
    return wallet;
}
/**
 * Reserve credits for a request (decrement available credits and increment reserved).
 * Returns the updated wallet or null if insufficient credits.
 */
async function reserveCredits(userId, amount) {
    // find wallet with enough credits (supporting operator queries via our model)
    const wallet = await wallet_model_1.default.findOne({ userId, credits: { $gte: amount } });
    if (!wallet)
        return null;
    const updated = await wallet_model_1.default.findOneAndUpdate({ _id: wallet._id }, { credits: (wallet.credits ?? 0) - amount, reserved: (wallet.reserved ?? 0) + amount }, { new: true });
    return updated;
}
/**
 * Finalize charge: subtract reserved and save (reserved already subtracted from credits when reserving).
 * 'amount' is the finalized amount to remove from reserved (could be equal to reserved).
 */
async function finalizeCharge(userId, amount) {
    const wallet = await wallet_model_1.default.findOne({ userId, reserved: { $gte: amount } });
    if (!wallet)
        return null;
    const updated = await wallet_model_1.default.findOneAndUpdate({ _id: wallet._id }, { reserved: (wallet.reserved ?? 0) - amount }, { new: true });
    return updated;
}
/**
 * Refund reserved credits back to available credits (used when provider fails)
 */
async function refundReserved(userId, amount) {
    const wallet = await wallet_model_1.default.findOne({ userId, reserved: { $gte: amount } });
    if (!wallet)
        return null;
    const updated = await wallet_model_1.default.findOneAndUpdate({ _id: wallet._id }, { reserved: (wallet.reserved ?? 0) - amount, credits: (wallet.credits ?? 0) + amount }, { new: true });
    return updated;
}
