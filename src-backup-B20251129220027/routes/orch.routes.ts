import express from "express";
import { postChatHandler } from "../controllers/orch.controller";

const router = express.Router();

router.post("/api/v1/chat", postChatHandler);

export default router;
