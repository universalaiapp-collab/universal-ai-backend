"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seedWallet.ts
// usage: node scripts/seedWallet.js userEmail initialCredits
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
async function main() {
    await mongoose_1.default.connect(MONGO, {});
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node scripts/seedWallet.js <userId> <credits>');
        process.exit(1);
    }
    const userId = args[0];
    const credits = Number(args[1]);
    let w = await wallet_model_1.default.findOne({ userId });
    if (!w) {
        w = await wallet_model_1.default.create({ userId, credits, reserved: 0, ledger: [] });
        console.log('Wallet created', w.toJSON());
    }
    else {
        w.credits = credits;
        await w.save();
        console.log('Wallet updated', w.toJSON());
    }
    process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
