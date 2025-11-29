"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callGemini = exports.callOpenAI = void 0;
// src/services/providerAdapters/index.ts
var openai_adapter_1 = require("./openai.adapter");
Object.defineProperty(exports, "callOpenAI", { enumerable: true, get: function () { return openai_adapter_1.callOpenAI; } });
var gemini_adapter_1 = require("./gemini.adapter");
Object.defineProperty(exports, "callGemini", { enumerable: true, get: function () { return gemini_adapter_1.callGemini; } });
__exportStar(require("./types"), exports);
