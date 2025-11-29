// src/models/wallet.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
  userId: { type: String, required: true, index: true },
  credits: { type: Number, required: true, default: 0 },
  reserved: { type: Number, required: true, default: 0 },
  ledger: [{ amount: Number, reason: String, at: { type: Date, default: () => new Date() }, meta: Schema.Types.Mixed }]
}, { timestamps: true });

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
