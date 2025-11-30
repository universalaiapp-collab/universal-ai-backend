// src/models/metrics.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MetricsSchema = new Schema({
  userId: { type: String, index: true },
  provider: String,
  model: String,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  estCost: Number,
  meta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.models.Metrics || mongoose.model('Metrics', MetricsSchema);
