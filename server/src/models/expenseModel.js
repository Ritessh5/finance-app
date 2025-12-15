import { pool } from "../config/db.js";

export const addExpense = async (userId, amount, category, description, date, type) => {
  const result = await pool.query(
    `INSERT INTO expenses (user_id, amount, category, description, date, type)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, amount, category, description, date, type]
  );

  return result.rows[0];
};

export const getExpensesByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC`,
    [userId]
  );

  return result.rows;
};
