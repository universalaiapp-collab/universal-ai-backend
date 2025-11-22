// scripts/restoreWalletFromSnapshot.js
// Usage: node scripts/restoreWalletFromSnapshot.js <userId>
const mongoose = require('mongoose');
const [,, userId] = process.argv;
if (!userId) { console.error('Usage: node scripts/restoreWalletFromSnapshot.js <userId>'); process.exit(1); }
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
(async function(){
  await mongoose.connect(MONGO).catch(e=>{ console.error('mongo connect err', e.message); process.exit(1); });
  const Backups = mongoose.models.Backups || mongoose.model('Backups', new mongoose.Schema({}, { strict: false }), 'backups');
  const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', new mongoose.Schema({}, { strict: false }), 'wallets');

  const snap = await Backups.findOne({ 'doc.userId': userId, type: 'wallet-snapshot' }).sort({ at: -1 }).lean();
  if (!snap) { console.error('No snapshot found for', userId); process.exit(2); }
  const doc = snap.doc;
  delete doc._id; // ensure replaceOne upsert works
  console.log('Restoring snapshot taken at', snap.at);
  await Wallet.replaceOne({ userId }, doc, { upsert: true });
  console.log('Restored wallet for', userId);
  await mongoose.disconnect();
})();
