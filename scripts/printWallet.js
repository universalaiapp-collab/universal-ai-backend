// scripts/printWallet.js
const mongoose = require('mongoose');
const Wallet = require('../src/models/wallet.model');

(async function(){
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
  await mongoose.connect(MONGO).catch(e => { console.error('Mongo connect error', e.message); process.exit(1); });
  const w = await Wallet.findOne({ userId: 'shubh@example.com' }).lean();
  console.log(JSON.stringify(w, null, 2));
  await mongoose.disconnect();
})();
