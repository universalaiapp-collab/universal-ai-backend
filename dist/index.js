"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const orch_routes_1 = __importDefault(require("./routes/orch.routes"));
const db_1 = require("./config/db");
const globalConfig_1 = __importDefault(require("./config/globalConfig"));
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
const auth_middleware_1 = __importDefault(require("./middleware/auth.middleware"));
const app = (0, express_1.default)();
// bigger body limit per your blueprint
app.use(express_1.default.json({ limit: "5mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "5mb" }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
// attach config and default temperature
app.locals.config = globalConfig_1.default;
app.set("defaultTemperature", 0.7);
// DB connect
(0, db_1.connectDB)();
// health
app.get("/", (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "development" }));
// routes
app.use("/auth", auth_routes_1.default);
app.use("/orch", orch_routes_1.default);
// protected sanity
app.get("/me", auth_middleware_1.default, (req, res) => {
    return res.json({ user: req.user });
});
// global error handler
app.use(error_middleware_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
