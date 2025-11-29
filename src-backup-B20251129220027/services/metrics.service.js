// src/services/metrics.service.js
const Metrics = require('../models/metrics.model');

async function recordMetrics(doc) {
  return Metrics.create(doc);
}

async function queryMetrics(query = {}, limit = 100) {
  return Metrics.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = { recordMetrics, queryMetrics };
