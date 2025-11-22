// src/index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes";
import orchRoutes from "./routes/orch.routes";
import { connectDB } from "./config/db";
import GLOBAL from "./config/globalConfig";
import errorHandler from "./middleware/error.middleware";
import authMiddleware from "./middleware/auth.middleware";

const app = express();

// bigger body limit per your blueprint
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(cors());
app.use(helmet());

// attach config and default temperature
app.locals.config = GLOBAL;
app.set("defaultTemperature", 0.7);

// DB connect
connectDB();

// health
app.get("/", (req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);

// routes
app.use("/auth", authRoutes);
app.use("/orch", orchRoutes);

// protected sanity
app.get("/me", authMiddleware, (req: any, res) => {
  return res.json({ user: req.user });
});

// global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
