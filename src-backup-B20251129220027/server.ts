// src/server.ts
import express from "express";
import dotenv from "dotenv";
import orchRoutes from "./routes/orch.routes";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/orch", orchRoutes);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Orchestrator listening on port ${PORT}`);
});
