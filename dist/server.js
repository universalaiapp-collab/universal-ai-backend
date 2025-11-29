"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const orch_routes_1 = __importDefault(require("./routes/orch.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "1mb" }));
app.use("/api/v1/orch", orch_routes_1.default);
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
    console.log(`Orchestrator listening on port ${PORT}`);
});
