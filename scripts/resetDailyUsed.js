// scripts/resetDailyUsed.js
const mongoose = require('mongoose');
const User = require('../src/models/user.model');

(async function(){
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
  await mongoose.connect(MONGO).catch(e => { console.error('Mongo connect error', e.message); process.exit(1); });
  await User.updateOne({ email: 'shubh@example.com' }, { $set: { dailyTokensUsed: 0 } }, { upsert: true });
  console.log('reset dailyTokensUsed to 0');
  await mongoose.disconnect();
})();
