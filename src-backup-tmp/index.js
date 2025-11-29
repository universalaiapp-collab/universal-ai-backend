"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const orch_1 = __importDefault(require("./routes/orch"));
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.post("/orch", orch_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Orchestrator listening on port ${PORT}`);
});
