"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/local_orch.ts
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var dotenv_1 = require("dotenv");
var morgan_1 = require("morgan");
var path_1 = require("path");
// Load .env from project root by default
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), ".env") });
var PORT = Number(process.env.PORT || 5000);
var ENABLE_FAKE_PROVIDERS = (process.env.ENABLE_FAKE_PROVIDERS || "false").toLowerCase() === "true";
// Minimal in-file model map (adjust as needed)
var MODEL_MAP = {
    "gpt-4o-mini": { provider: "openai", model: "gpt-4o-mini", type: "chat" },
    "gemini-1.5-flash": { provider: "gemini", model: "gemini-1.5-flash", type: "chat" },
    "gemini-flash": { provider: "gemini", model: "gemini-1.5-flash", type: "chat" },
};
var app = (0, express_1.default)();
app.use(body_parser_1.default.json({ limit: "1mb" }));
app.use((0, morgan_1.default)("dev"));
app.get("/orch/health", function (_req, res) {
    res.json({ ok: true, service: "orchestrator", env: process.env.NODE_ENV || "development" });
});
/**
 * Simple unified handler for /orch endpoints
 * Expected body: { model: string, messages?: [{role,content}], kind?: "chat"|"image"|"embedding", ... }
 */
app.post("/orch/:action?", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var action, body, modelKey, messages, kind, route, simulatedRaw, parsed_1, providerName, providerModule, rawResponse, input, parsed, c, err_1;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 20, , 21]);
                action = req.params.action || "";
                body = req.body || {};
                modelKey = (body.model || req.query.model || "").toString();
                messages = Array.isArray(body.messages) ? body.messages : [];
                kind = (body.kind || action || "chat").toString();
                if (!modelKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Missing required field: model" })];
                }
                route = MODEL_MAP[modelKey];
                if (!route) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Unknown model key: ".concat(modelKey) })];
                }
                // If fake providers enabled — return simulated response immediately
                if (ENABLE_FAKE_PROVIDERS) {
                    simulatedRaw = {
                        simulated: true,
                        model: route.model,
                        provider: route.provider,
                        content: "Simulated ".concat(kind, " response for model ").concat(route.model),
                    };
                    parsed_1 = {
                        success: true,
                        provider: route.provider,
                        type: route.type === "embedding" ? "embedding" : "text",
                        output: simulatedRaw.content,
                        raw: simulatedRaw,
                    };
                    return [2 /*return*/, res.json({
                            success: true,
                            provider: route.provider,
                            model: route.model,
                            kind: route.type,
                            response: parsed_1,
                        })];
                }
                providerName = route.provider;
                providerModule = null;
                try {
                    // attempt common paths inside your project
                    // 1) src/providers/<provider>.provider.ts compiled to dist/providers/*.js
                    providerModule =
                        require(path_1.default.resolve(process.cwd(), "dist", "providers", "".concat(providerName, ".provider.js"))) ||
                            require(path_1.default.resolve(process.cwd(), "src", "providers", "".concat(providerName, ".provider.ts")));
                }
                catch (err) {
                    // try generic name
                    try {
                        providerModule = require(path_1.default.resolve(process.cwd(), "dist", "providers", "".concat(providerName, ".js")));
                    }
                    catch (err2) {
                        // module missing — return helpful error
                        return [2 /*return*/, res.status(500).json({
                                success: false,
                                error: "Provider module not found for '".concat(providerName, "'. For local testing enable ENABLE_FAKE_PROVIDERS=true in your environment, or add dist/providers/").concat(providerName, ".provider.js"),
                                details: (err2 === null || err2 === void 0 ? void 0 : err2.message) || (err === null || err === void 0 ? void 0 : err.message),
                            })];
                    }
                }
                rawResponse = null;
                if (!(kind === "embedding" || route.type === "embedding")) return [3 /*break*/, 8];
                input = (_a = body.input) !== null && _a !== void 0 ? _a : messages.map(function (m) { return m.content; }).join("\n");
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.geminiEmbedding) === "function")) return [3 /*break*/, 2];
                return [4 /*yield*/, providerModule.geminiEmbedding({ model: route.model, input: input })];
            case 1:
                rawResponse = _h.sent();
                return [3 /*break*/, 7];
            case 2:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.openaiEmbedding) === "function")) return [3 /*break*/, 4];
                return [4 /*yield*/, providerModule.openaiEmbedding({ model: route.model, input: input })];
            case 3:
                rawResponse = _h.sent();
                return [3 /*break*/, 7];
            case 4:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.embedding) === "function")) return [3 /*break*/, 6];
                return [4 /*yield*/, providerModule.embedding({ model: route.model, input: input })];
            case 5:
                rawResponse = _h.sent();
                return [3 /*break*/, 7];
            case 6: return [2 /*return*/, res.status(500).json({ success: false, error: "Embedding function not found on provider module" })];
            case 7: return [3 /*break*/, 19];
            case 8:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.geminiChat) === "function")) return [3 /*break*/, 10];
                return [4 /*yield*/, providerModule.geminiChat({ model: route.model, messages: messages, temperature: body.temperature })];
            case 9:
                rawResponse = _h.sent();
                return [3 /*break*/, 19];
            case 10:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.openaiChat) === "function")) return [3 /*break*/, 12];
                return [4 /*yield*/, providerModule.openaiChat({ model: route.model, messages: messages, temperature: body.temperature })];
            case 11:
                rawResponse = _h.sent();
                return [3 /*break*/, 19];
            case 12:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.chat) === "function")) return [3 /*break*/, 14];
                return [4 /*yield*/, providerModule.chat({ model: route.model, messages: messages, temperature: body.temperature })];
            case 13:
                rawResponse = _h.sent();
                return [3 /*break*/, 19];
            case 14:
                if (!(typeof (providerModule === null || providerModule === void 0 ? void 0 : providerModule.default) === "function")) return [3 /*break*/, 16];
                return [4 /*yield*/, providerModule.default({ model: route.model, messages: messages, temperature: body.temperature })];
            case 15:
                rawResponse = _h.sent();
                return [3 /*break*/, 19];
            case 16:
                if (!((providerModule === null || providerModule === void 0 ? void 0 : providerModule.default) && typeof providerModule.default.geminiChat === "function")) return [3 /*break*/, 18];
                return [4 /*yield*/, providerModule.default.geminiChat({ model: route.model, messages: messages, temperature: body.temperature })];
            case 17:
                rawResponse = _h.sent();
                return [3 /*break*/, 19];
            case 18: return [2 /*return*/, res.status(500).json({ success: false, error: "Chat function not found on provider module" })];
            case 19:
                parsed = { success: true, provider: providerName, type: "text", output: null, raw: rawResponse };
                if (!rawResponse) {
                    parsed.output = "";
                }
                else if (typeof rawResponse === "string") {
                    parsed.output = rawResponse;
                }
                else if ((rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.output) && Array.isArray(rawResponse.output) && ((_b = rawResponse.output[0]) === null || _b === void 0 ? void 0 : _b.content)) {
                    c = rawResponse.output[0].content;
                    parsed.output = Array.isArray(c) ? c.map(function (x) { var _a; return (_a = x === null || x === void 0 ? void 0 : x.text) !== null && _a !== void 0 ? _a : JSON.stringify(x); }).join("\n") : safeString(c);
                }
                else if ((rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.choices) && Array.isArray(rawResponse.choices)) {
                    parsed.output = (_g = (_e = (_d = (_c = rawResponse.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : (_f = rawResponse.choices[0]) === null || _f === void 0 ? void 0 : _f.text) !== null && _g !== void 0 ? _g : safeString(rawResponse.choices[0]);
                }
                else if (rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.response) {
                    parsed.output = rawResponse.response;
                }
                else {
                    parsed.output = safeString(rawResponse);
                }
                return [2 /*return*/, res.json({
                        success: true,
                        provider: providerName,
                        model: route.model,
                        kind: route.type,
                        response: parsed,
                    })];
            case 20:
                err_1 = _h.sent();
                console.error("[local_orch] handler error:", err_1);
                return [2 /*return*/, res.status(500).json({ success: false, error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || "internal_error", stack: err_1 === null || err_1 === void 0 ? void 0 : err_1.stack })];
            case 21: return [2 /*return*/];
        }
    });
}); });
function safeString(v) {
    if (v == null)
        return "";
    if (typeof v === "string")
        return v;
    try {
        return JSON.stringify(v);
    }
    catch (_a) {
        return String(v);
    }
}
app.listen(PORT, function () {
    console.log("[local_orch] Orchestrator listening on port ".concat(PORT, "  (ENABLE_FAKE_PROVIDERS=").concat(ENABLE_FAKE_PROVIDERS, ")"));
});
