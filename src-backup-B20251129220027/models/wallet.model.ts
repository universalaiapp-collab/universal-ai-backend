// src/models/wallet.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId | string;
  credits: number;
  reserved: number;
  ledger: { amount: number; reason: string; at: Date; meta?: any }[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  credits: { type: Number, required: true, default: 0 },
  reserved: { type: Number, required: true, default: 0 },
  ledger: [{ amount: Number, reason: String, at: { type: Date, default: () => new Date() }, meta: Schema.Types.Mixed }]
}, { timestamps: true });

const WalletModel = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
export default WalletModel;
