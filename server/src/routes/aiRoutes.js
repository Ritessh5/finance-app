// server/src/routes/aiRoutes.js
import express from "express";
import { auth } from "../middlewares/authMiddleware.js";

import {
  getAIInsights,
  getAIBudget,
  getAIForecast,
} from "../controllers/aiController.js";

const router = express.Router();

router.get("/insights", auth, getAIInsights);
router.get("/budget", auth, getAIBudget);
router.get("/forecast", auth, getAIForecast);

export default router;
