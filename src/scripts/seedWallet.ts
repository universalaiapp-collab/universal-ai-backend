// scripts/seedWallet.ts
// usage: node scripts/seedWallet.js userEmail initialCredits
import mongoose from 'mongoose';
import WalletModel from '../models/wallet.model';
import UserModel from '../models/user.model'; // OPTIONAL

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';

async function main() {
  await mongoose.connect(MONGO, { } as any);
  const args = process.argv.slice(2);
  if (args.length < 2) { console.error('Usage: node scripts/seedWallet.js <userId> <credits>'); process.exit(1); }
  const userId = args[0];
  const credits = Number(args[1]);

  let w = await (WalletModel as any).findOne({ userId });
  if (!w) {
    w = await (WalletModel as any).create({ userId, credits, reserved: 0, ledger: [] });
    console.log('Wallet created', w.toJSON());
  } else {
    w.credits = credits;
    await w.save();
    console.log('Wallet updated', w.toJSON());
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });


