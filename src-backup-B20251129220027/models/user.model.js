// src/models/user.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: String,
  tier: { type: String, default: 'FREE' },
  dailyTokensUsed: { type: Number, default: 0 },
  role: { type: String, default: 'user' }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
