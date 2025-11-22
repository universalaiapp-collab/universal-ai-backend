// scripts/repairWalletCredits.js
// Usage: node scripts/repairWalletCredits.js <userId> [startingBalance]
const mongoose = require('mongoose');
const [,, userId, startingArg] = process.argv;
if (!userId) {
  console.error('Usage: node scripts/repairWalletCredits.js <userId> [startingBalance]');
  process.exit(1);
}
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
(async function(){
  await mongoose.connect(MONGO).catch(e=>{ console.error('mongo connect err', e.message); process.exit(1); });
  const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

  const w = await Wallet.findOne({ userId });
  if (!w) { console.error('Wallet not found for', userId); process.exit(2); }
  const ledgerSum = (w.ledger || []).reduce((s, e) => s + (e.amount || 0), 0);
  const starting = startingArg ? Number(startingArg) : (w.startingBalance != null ? Number(w.startingBalance) : 10000);
  const newCredits = Number((starting + ledgerSum).toFixed(12));
  console.log('Recomputing:', { userId, starting, ledgerSum, newCredits });
  await Wallet.updateOne({ userId }, { $set: { credits: newCredits } });
  console.log('Updated credits for', userId);
  await mongoose.disconnect();
})();
