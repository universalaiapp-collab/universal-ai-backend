// src/routes/orch.routes.js
const express = require('express');
const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter.middleware');
const quota = require('../middleware/quota.middleware');
const paywall = require('../middleware/paywall.middleware');
const { orchController } = require('../controllers/orch.controller');

router.post('/orch', rateLimiter, quota, paywall, orchController);

module.exports = router;
