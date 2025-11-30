// src/services/wallet.service.js
const Wallet = require('../models/wallet.model');
const mongoose = require('mongoose');

async function getWalletByUserId(userId) {
  return Wallet.findOne({ userId }).lean();
}

async function createOrGetWallet(userId, initialCredits = 0) {
  let w = await Wallet.findOne({ userId });
  if (w) return w;
  return Wallet.create({ userId, credits: initialCredits, reserved: 0, ledger: [] });
}

async function reserveCredits(userId, amount) {
  if (!amount || amount <= 0) return { success: true };
  const res = await Wallet.findOneAndUpdate(
    { userId, credits: { $gte: amount } },
    { $inc: { credits: -amount, reserved: amount } },
    { new: true }
  ).lean();
  if (!res) return { success: false, message: 'insufficient_credits' };
  return { success: true, wallet: res };
}

async function finalizeDeduction(userId, amount, meta = {}) {
  if (!amount || amount <= 0) return null;
  const res = await Wallet.findOneAndUpdate(
    { userId, reserved: { $gte: amount } },
    { $inc: { reserved: -amount }, $push: { ledger: { amount: -amount, reason: 'usage', at: new Date(), meta } } },
    { new: true }
  );
  return res;
}

async function refundReserved(userId, amount, reason = 'refund') {
  if (!amount || amount <= 0) return null;
  const res = await Wallet.findOneAndUpdate(
    { userId, reserved: { $gte: amount } },
    { $inc: { reserved: -amount, credits: amount }, $push: { ledger: { amount, reason, at: new Date() } } },
    { new: true }
  );
  return res;
}

module.exports = {
  getWalletByUserId,
  createOrGetWallet,
  reserveCredits,
  finalizeDeduction,
  refundReserved
};
