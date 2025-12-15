// server/src/controllers/aiController.js
import { pool } from "../config/db.js";

/* ----------------------------------------------------------
   1. AI INSIGHTS (with FIXED monthly savings)
----------------------------------------------------------- */
export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all transactions
    const result = await pool.query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );
    const txns = result.rows;

    if (txns.length === 0) {
      return res.json({ insights: "No transactions found to analyze." });
    }

    // Total Income & Expense
    const totalIncome = txns
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + Number(b.amount), 0);

    const totalExpense = txns
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + Number(b.amount), 0);

    // Category-wise spending
    const categoryMap = {};
    txns.forEach((t) => {
      if (t.type === "expense") {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      }
    });

    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] || [
      "None",
      0,
    ];

    // Largest Transaction
    const largestTxn = txns.sort((a, b) => b.amount - a.amount)[0];

    // Avg expense
    const expenseCount = txns.filter((t) => t.type === "expense").length;
    const avgExpense = expenseCount ? (totalExpense / expenseCount).toFixed(2) : 0;

    /* ----------------------------------------------
       FIX SECTION → Get latest month income/expense
    ----------------------------------------------- */
    const monthlyStats = await pool.query(
      `
      SELECT 
        DATE_TRUNC('month', date) AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM expenses
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month DESC
      LIMIT 1;
      `,
      [userId]
    );

    const latest = monthlyStats.rows[0];
    const monthlySaving = latest.income - latest.expense;

    const latestMonthName = latest.month.toISOString().slice(0, 7);

    const insights = `
Your total income is ₹${totalIncome} and total expense is ₹${totalExpense}.
You spent the most on ${topCategory[0]} (₹${topCategory[1]}).
Your largest transaction was ₹${largestTxn.amount} for "${largestTxn.description}".
Your average spending per transaction is ₹${avgExpense}.
You saved ₹${monthlySaving} in ${latestMonthName}.
`;

    res.json({ insights });
  } catch (err) {
    console.error("AI Insights Error:", err);
    res.status(500).json({ message: "AI Insights failed" });
  }
};

/* ----------------------------------------------------------
   2. AI BUDGET PLANNER
----------------------------------------------------------- */
export const getAIBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthsWindow = 3;

    const totalsResult = await pool.query(
      `
      SELECT type, SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY type
      `,
      [userId]
    );

    let incomeTotal = 0;
    let expenseTotal = 0;

    totalsResult.rows.forEach((row) => {
      if (row.type === "income") incomeTotal = Number(row.total);
      if (row.type === "expense") expenseTotal = Number(row.total);
    });

    const avgMonthlyIncome = incomeTotal / monthsWindow;
    const avgMonthlyExpense = expenseTotal / monthsWindow;

    const recommendedMonthlyBudget =
      avgMonthlyExpense > 0 ? avgMonthlyExpense * 0.9 : 0;

    const safeDailySpend =
      recommendedMonthlyBudget > 0 ? recommendedMonthlyBudget / 30 : 0;

    const categoryResult = await pool.query(
      `
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE user_id = $1
        AND type = 'expense'
        AND date >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY category
      ORDER BY total DESC
      `,
      [userId]
    );

    const categories = categoryResult.rows.map((row) => {
      const total = Number(row.total);
      const avgPerMonth = total / monthsWindow;
      return {
        category: row.category,
        avgMonthlySpend: avgPerMonth,
        suggestedBudget: avgPerMonth * 0.9,
      };
    });

    res.json({
      windowMonths: monthsWindow,
      overall: {
        avgMonthlyIncome,
        avgMonthlyExpense,
        recommendedMonthlyBudget,
        safeDailySpend,
      },
      categories,
    });
  } catch (err) {
    console.error("AI Budget Error:", err);
    res.status(500).json({ message: "AI Budget failed" });
  }
};

/* ----------------------------------------------------------
   3. AI FORECAST
----------------------------------------------------------- */
export const getAIForecast = async (req, res) => {
  try {
    const userId = req.user.id;

    const monthlyResult = await pool.query(
      `
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM expenses
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month
      `,
      [userId]
    );

    const history = monthlyResult.rows.map((row) => ({
      month: row.month,
      income: Number(row.income),
      expense: Number(row.expense),
    }));

    const forecastSeries = (values) => {
      const n = values.length;
      if (n === 0) return { next: 0, trend: "no-data" };
      if (n === 1) return { next: values[0], trend: "flat" };

      const xs = Array.from({ length: n }, (_, i) => i);
      const ys = values;

      const sumX = xs.reduce((a, b) => a + b, 0);
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
      const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = n * sumX2 - sumX * sumX;
      const slope = denominator === 0 ? 0 : numerator / denominator;
      const intercept = (sumY - slope * sumX) / n;

      let next = intercept + slope * n;
      if (next < 0) next = 0;

      const avg = sumY / n;
      let trend = "flat";
      if (Math.abs(slope) > avg * 0.15) {
        trend = slope > 0 ? "rising" : "falling";
      }

      return { next, trend };
    };

    const incomeSeries = history.map((h) => h.income);
    const expenseSeries = history.map((h) => h.expense);

    const incomeForecast = forecastSeries(incomeSeries);
    const expenseForecast = forecastSeries(expenseSeries);

    let nextMonthLabel = "Next Month";
    if (history.length > 0) {
      const last = history[history.length - 1].month;
      const [year, month] = last.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      date.setMonth(date.getMonth() + 1);
      nextMonthLabel = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
    }

    res.json({
      history,
      forecast: {
        nextMonth: nextMonthLabel,
        predictedIncome: incomeForecast.next,
        predictedExpense: expenseForecast.next,
        incomeTrend: incomeForecast.trend,
        expenseTrend: expenseForecast.trend,
      },
    });
  } catch (err) {
    console.error("AI Forecast Error:", err);
    res.status(500).json({ message: "AI Forecast failed" });
  }
};
