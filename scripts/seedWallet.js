// scripts/seedWallet.js (JS)
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
const userId = process.argv[2];
const credits = Number(process.argv[3] || 10000);

if (!userId) {
  console.error('Usage: node scripts/seedWallet.js <userId> <credits>');
  process.exit(1);
}

const WalletSchema = new mongoose.Schema({
  userId: String,
  credits: Number,
  reserved: Number,
  ledger: Array
}, { timestamps: true });

async function main() {
  await mongoose.connect(MONGO).catch(e => { console.error('Mongo connect error:', e.message); });
  const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
  let w = await Wallet.findOne({ userId });
  if (!w) {
    w = await Wallet.create({ userId, credits, reserved: 0, ledger: [] });
    console.log('Wallet created', { userId: w.userId, credits: w.credits });
  } else {
    w.credits = credits;
    await w.save();
    console.log('Wallet updated', { userId: w.userId, credits: w.credits });
  }
  await mongoose.disconnect();
  process.exit(0);
}
main();
