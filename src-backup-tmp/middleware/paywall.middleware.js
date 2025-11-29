"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paywallMiddleware = paywallMiddleware;
const day2Config_1 = __importDefault(require("../config/day2Config"));
function paywallMiddleware(req, res, next) {
    // This middleware expects that quota and wallet checks have already run.
    // If we want to centrally enforce behavior based on app.locals.paywallMode, do it here.
    const mode = process.env.PAYWALL_MODE || day2Config_1.default.paywallMode || 'hard';
    req.paywallMode = mode;
    next();
}
