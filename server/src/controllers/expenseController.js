import { pool } from "../config/db.js";

// ADD Expense / Income
export const createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, category, description, date, type } = req.body;

    if (!amount || !category || !description || !date || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, category, description, date, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, category, description, date, type]
    );

    res.status(201).json({
      message: "Expense added successfully",
      expense: result.rows[0],
    });
  } catch (err) {
    console.error("Create expense error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET ALL Expenses of logged-in user
export const getMyExpenses = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC`,
      [userId]
    );

    res.json({ expenses: result.rows });
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// SUMMARY API
export const getSummaryData = async (req, res) => {
  try {
    const userId = req.user.id;

    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income
       FROM expenses
       WHERE user_id = $1 AND type = 'income'`,
      [userId]
    );

    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expense
       FROM expenses
       WHERE user_id = $1 AND type = 'expense'`,
      [userId]
    );

    const transactions = await pool.query(
      `SELECT *
       FROM expenses
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 5`,
      [userId]
    );

    const total_income = Number(incomeResult.rows[0].total_income);
    const total_expense = Number(expenseResult.rows[0].total_expense);

    res.json({
      total_income,
      total_expense,
      balance: total_income - total_expense,
      recent: transactions.rows,
    });

  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;
    const { amount, category, description, date, type } = req.body;

    if (!amount || !category || !description || !date || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      `UPDATE expenses
       SET amount = $1, category = $2, description = $3, date = $4, type = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [amount, category, description, date, type, expenseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense updated", expense: result.rows[0] });

  } catch (err) {
    console.error("Update expense error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;

    const result = await pool.query(
      `DELETE FROM expenses WHERE id = $1 AND user_id = $2`,
      [expenseId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });

  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getCategorySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM expenses 
       WHERE user_id = $1
       GROUP BY category`,
      [userId]
    );

    res.json(result.rows);
    
  } catch (err) {
    res.status(500).json({ error: "Error loading category summary" });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
         TO_CHAR(date, 'YYYY-MM') AS month,
         SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
       FROM expenses
       WHERE user_id = $1
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Monthly summary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, minAmount, maxAmount, search } = req.query;

    let query = `SELECT * FROM expenses WHERE user_id = $1`;
    let params = [req.user.id];
    let index = 2;

    if (type && type !== "all") {
      query += ` AND type = $${index++}`;
      params.push(type);
    }

    if (category && category !== "all") {
      query += ` AND category = $${index++}`;
      params.push(category);
    }

    if (startDate) {
      query += ` AND date >= $${index++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date <= $${index++}`;
      params.push(endDate);
    }

    if (minAmount) {
      query += ` AND amount >= $${index++}`;
      params.push(minAmount);
    }

    if (maxAmount) {
      query += ` AND amount <= $${index++}`;
      params.push(maxAmount);
    }

    if (search) {
      query += ` AND (description ILIKE $${index++})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, params);  // ✔ FIXED

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};
export const getMonthlyStats = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('month', date) AS month,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
      FROM expenses
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Monthly stats error", error);
    res.status(500).json({ error: "Failed to get monthly stats" });
  }
};
