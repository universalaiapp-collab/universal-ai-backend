// scripts/auditWallets.js
const mongoose = require('mongoose');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
(async function(){
  await mongoose.connect(MONGO).catch(e=>{ console.error('mongo connect err', e.message); process.exit(1); });
  const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

  console.log('Auditing wallets...');
  const cursor = Wallet.find().cursor();
  let bad = 0;
  for await (const w of cursor) {
    const ledger = w.ledger || [];
    const ledgerSum = ledger.reduce((s, e) => s + (e.amount || 0), 0);
    const starting = (w.startingBalance != null) ? Number(w.startingBalance) : 10000; // fallback
    const expected = Number((starting + ledgerSum).toFixed(12));
    const credits = Number((w.credits || 0).toFixed(12));
    if (Math.abs(credits - expected) > 1e-9) {
      bad++;
      console.log(JSON.stringify({ userId: w.userId, credits, expected, ledgerSum }, null, 2));
    }
  }
  console.log('Audit done. wallets mismatched:', bad);
  await mongoose.disconnect();
})();
