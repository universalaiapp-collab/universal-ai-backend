// src/middleware/paywall.middleware.js
const day2Config = require('../config/day2Config');

function paywallMiddleware(req, res, next) {
  const mode = process.env.PAYWALL_MODE || day2Config.paywallMode || 'hard';
  req.paywallMode = mode;
  next();
}

module.exports = paywallMiddleware;
