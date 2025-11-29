// scripts/setTier.js
const mongoose = require("mongoose");
const User = require("../dist/models/user.model").default || require("../src/models/user.model");
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2];
  const tier = process.argv[3] || "FREE";
  if (!email) {
    console.log("Usage: node scripts/setTier.js email tier");
    process.exit(1);
  }
  const u = await mongoose.model("User").findOneAndUpdate({ email }, { tier }, { new: true, upsert: false });
  console.log("Updated:", u);
  process.exit(0);
})();
