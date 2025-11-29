"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/orch.routes.ts
const express_1 = __importDefault(require("express"));
const orch_controller_1 = require("../controllers/orch.controller");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const quota_middleware_1 = require("../middleware/quota.middleware");
const paywall_middleware_1 = require("../middleware/paywall.middleware");
const router = express_1.default.Router();
router.post('/orch', 
// assume authentication middleware runs before and sets req.user
rateLimiter_middleware_1.rateLimiterMiddleware, quota_middleware_1.quotaMiddleware, paywall_middleware_1.paywallMiddleware, orch_controller_1.orchController);
exports.default = router;
