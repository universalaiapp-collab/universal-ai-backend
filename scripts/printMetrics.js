// scripts/printMetrics.js
const mongoose = require('mongoose');
const Metrics = require('../src/models/metrics.model');

(async function(){
  const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/universal-ai';
  await mongoose.connect(MONGO).catch(e => { console.error('Mongo connect error', e.message); process.exit(1); });
  const rows = await Metrics.find({}).sort({ createdAt: -1 }).limit(20).lean();
  console.log(JSON.stringify(rows, null, 2));
  await mongoose.disconnect();
})();
