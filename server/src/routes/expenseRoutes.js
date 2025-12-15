import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import {
  createExpense,
  getMyExpenses,
  getSummaryData,
  updateExpense,
  deleteExpense,
  getCategorySummary,
  getMonthlySummary,
  getAllTransactions,
  getMonthlyStats  
} from "../controllers/expenseController.js";

const router = express.Router();

router.post("/", auth, createExpense);
router.get("/", auth, getMyExpenses);
router.get("/summary", auth, getSummaryData);
router.put("/:id", auth, updateExpense);
router.delete("/:id", auth, deleteExpense);
router.get("/monthly-stats", auth, getMonthlyStats);

router.get("/category-summary", auth, getCategorySummary);
router.get("/monthly-summary", auth, getMonthlySummary);

// ⭐ ADD THIS ROUTE
router.get("/all", auth, getAllTransactions);

export default router;
