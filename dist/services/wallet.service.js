"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletByUserId = getWalletByUserId;
exports.createOrGetWallet = createOrGetWallet;
exports.reserveCredits = reserveCredits;
exports.finalizeDeduction = finalizeDeduction;
exports.refundReserved = refundReserved;
// src/services/wallet.service.ts
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
async function getWalletByUserId(userId) {
    return wallet_model_1.default.findOne({ userId }).lean();
}
async function createOrGetWallet(userId, initialCredits = 0) {
    const existing = await wallet_model_1.default.findOne({ userId });
    if (existing)
        return existing;
    return wallet_model_1.default.create({ userId, credits: initialCredits, reserved: 0 });
}
/**
 * reserveCredits: atomically reduce available credits and increase reserved.
 * This attempts a single-document transaction via findOneAndUpdate.
 */
async function reserveCredits(userId, amount) {
    if (amount <= 0)
        return { success: true };
    const res = await wallet_model_1.default.findOneAndUpdate({ userId, credits: { $gte: amount } }, { $inc: { credits: -amount, reserved: amount } }, { new: true }).lean();
    if (!res) {
        return { success: false, message: 'insufficient_credits' };
    }
    return { success: true, wallet: res };
}
async function finalizeDeduction(userId, amount, meta = {}) {
    if (amount <= 0)
        return;
    // decrement reserved by amount and add ledger entry
    const res = await wallet_model_1.default.findOneAndUpdate({ userId, reserved: { $gte: amount } }, {
        $inc: { reserved: -amount },
        $push: { ledger: { amount: -amount, reason: 'usage', at: new Date(), meta } }
    }, { new: true });
    return res;
}
async function refundReserved(userId, amount, reason = 'refund') {
    if (amount <= 0)
        return;
    const res = await wallet_model_1.default.findOneAndUpdate({ userId, reserved: { $gte: amount } }, { $inc: { reserved: -amount, credits: amount }, $push: { ledger: { amount, reason, at: new Date() } } }, { new: true });
    return res;
}
