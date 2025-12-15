import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import "./config/db.js";        // Connect DB
import { auth } from "./middlewares/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ai", aiRoutes);

// Test route (protected)
app.get("/api/test-auth", auth, (req, res) => {
  res.json({ message: "Token is valid", user: req.user });
});

// Simple Route
app.get("/", (req, res) => {
  res.send({ message: "Welcome to the server!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
