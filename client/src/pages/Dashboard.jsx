// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { formatPrettyDate } from "../utils/dateUtils";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import AIInsights from "../components/AIInsights";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    recent: [],
  });

  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  const [editData, setEditData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [insights, setInsights] = useState("");
  const [budgetPlan, setBudgetPlan] = useState(null);
  const [forecast, setForecast] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSummary();
    fetchCategorySummary();
    fetchMonthlySummary();
    fetchAIInsights();
    fetchBudgetPlan();
    fetchForecast();
  }, []);

  /* ---------------- AI INSIGHTS FETCH ---------------- */
  const fetchAIInsights = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ai/insights", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(res.data.insights);
    } catch (err) {
      console.log("AI insights error:", err);
    }
  };

  /* ---------------- LOAD SUMMARY ---------------- */
  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data);
    } catch {
      alert("Failed to load summary");
    }
  };

  const fetchCategorySummary = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/expenses/category-summary",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCategoryData(
        res.data.map((c) => ({
          category: c.category,
          total: Number(c.total),
        }))
      );
    } catch {
      console.log("Category summary error");
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/expenses/monthly-summary",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMonthlyData(
        res.data.map((m) => ({
          month: m.month,
          income: Number(m.income),
          expense: Number(m.expense),
        }))
      );
    } catch {
      console.log("Monthly summary error");
    }
  };

  /* ---------------- BUDGET PLANNER ---------------- */
  const fetchBudgetPlan = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ai/budget", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgetPlan(res.data);
    } catch (err) {
      console.error("Budget planner error:", err);
    }
  };

  /* ---------------- FORECAST ---------------- */
  const fetchForecast = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/ai/forecast", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForecast(res.data.forecast);
    } catch (err) {
      console.error("Forecast error:", err);
    }
  };

  /* ---------------- DELETE TXN ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;

    await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchSummary();
    fetchCategorySummary();
    fetchMonthlySummary();
    fetchAIInsights();
    fetchBudgetPlan();
    fetchForecast();
  };

  /* ---------------- EDIT MODAL ---------------- */
  const openEditModal = (tx) => {
    const formattedDate = new Date(tx.date).toISOString().split("T")[0];
    setEditData({ ...tx, date: formattedDate });
    setShowModal(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/expenses/${editData.id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowModal(false);

      fetchSummary();
      fetchCategorySummary();
      fetchMonthlySummary();
      fetchAIInsights();
      fetchBudgetPlan();
      fetchForecast();
    } catch {
      alert("Update failed");
    }
  };

  const COLORS = ["#6366f1", "#22c55e", "#f97316", "#e11d48", "#06b6d4"];

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">

      {/* NAVBAR */}
      <div className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">
              F
            </div>
            <div>
              <h1 className="text-xl font-semibold">FinSight AI</h1>
              <p className="text-xs text-slate-400">
                Personal Finance & Investment Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="text-indigo-400 font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => (window.location.href = "/transactions")}
              className="text-slate-300 hover:text-indigo-300"
            >
              Transactions
            </button>
            <button
              onClick={() => (window.location.href = "/add-expense")}
              className="text-slate-300 hover:text-indigo-300"
            >
              Add Entry
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/";
              }}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* WELCOME */}
        <div>
          <h2 className="text-2xl font-semibold">
            Hi Ritessh, <span className="text-indigo-400">welcome back 👋</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Here’s a quick snapshot of your financial health and recent activity.
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total Income
            </p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-2">
              ₹ {summary.total_income}
            </h3>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Total Expense
            </p>
            <h3 className="text-3xl font-bold text-rose-400 mt-2">
              ₹ {summary.total_expense}
            </h3>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Balance
            </p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹ {summary.balance}
            </h3>
          </div>
        </div>

        {/* AI INSIGHTS */}
        <AIInsights insights={insights} />


        {/* ====================== AI BUDGET + FORECAST ====================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* BUDGET PLANNER */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">🧮 AI Budget Planner</h3>

            {!budgetPlan ? (
              <p className="text-slate-400 text-sm">
                Not enough data yet to build a budget plan.
              </p>
            ) : (
              <>
                <p className="text-slate-400 text-xs mb-2">
                  Based on the last {budgetPlan.windowMonths} months of your data.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-400">Avg Monthly Income</p>
                    <p className="text-emerald-400 font-semibold">
                      ₹ {budgetPlan.overall.avgMonthlyIncome.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Avg Monthly Expense</p>
                    <p className="text-rose-400 font-semibold">
                      ₹ {budgetPlan.overall.avgMonthlyExpense.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">
                      Recommended Monthly Budget
                    </p>
                    <p className="text-cyan-400 font-semibold">
                      ₹ {budgetPlan.overall.recommendedMonthlyBudget.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Safe Daily Spend</p>
                    <p className="text-indigo-400 font-semibold">
                      ₹ {budgetPlan.overall.safeDailySpend.toFixed(0)}
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-xs mb-3">
                  {budgetPlan.overall.comment}
                </p>

                <h4 className="text-sm font-semibold mb-2 text-slate-200">
                  Category-wise Suggested Budgets
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {budgetPlan.categories.map((c) => (
                    <div
                      key={c.category}
                      className="flex justify-between text-xs bg-slate-800/70 rounded-lg px-3 py-2"
                    >
                      <span className="text-slate-200">{c.category}</span>
                      <span className="text-slate-400">
                        Avg: ₹{c.avgMonthlySpend.toFixed(0)} →{" "}
                        <span className="text-indigo-300">
                          Budget: ₹{c.suggestedBudget.toFixed(0)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* FORECAST */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">📈 Next Month Forecast</h3>

            {!forecast ? (
              <p className="text-slate-400 text-sm">
                Not enough history to predict next month yet.
              </p>
            ) : (
              <>
                <p className="text-slate-400 text-xs mb-3">
                  Forecast for{" "}
                  <span className="font-semibold">{forecast.nextMonth}</span>{" "}
                  based on your past monthly data.
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-400">Predicted Income</p>
                    <p className="text-emerald-400 font-semibold">
                      ₹ {forecast.predictedIncome.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Trend: {forecast.incomeTrend}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Predicted Expense</p>
                    <p className="text-rose-400 font-semibold">
                      ₹ {forecast.predictedExpense.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Trend: {forecast.expenseTrend}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  Tip: Try to keep your actual expenses below the forecast to
                  increase your savings next month.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ====================== RECENT TXN + CHARTS ====================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* RECENT TRANSACTIONS */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <button
                onClick={() => (window.location.href = "/add-expense")}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-xs font-semibold"
              >
                + Add Expense
              </button>
            </div>

            {summary.recent.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No recent transactions. Start by adding one.
              </p>
            ) : (
              <div className="space-y-3">
                {summary.recent.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-slate-400">
                        {tx.category} • {formatPrettyDate(tx.date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          tx.type === "income"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}₹ {tx.amount}
                      </span>

                      <button
                        className="text-xs text-indigo-300 hover:text-indigo-200"
                        onClick={() => openEditModal(tx)}
                      >
                        Edit
                      </button>

                      <button
                        className="text-xs text-rose-400 hover:text-rose-300"
                        onClick={() => handleDelete(tx.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PIE CHART */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>

            <PieChart width={360} height={260}>
              <Pie
                data={categoryData}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {categoryData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1e293b",
                  color: "#e5e7eb",
                }}
              />
            </PieChart>
          </div>
        </div>

        {/* ====================== BAR + LINE CHARTS ====================== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* BAR CHART */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Monthly Expense Overview
            </h3>
            <BarChart width={450} height={260} data={monthlyData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1e293b",
                  color: "#e5e7eb",
                }}
              />
              <Bar dataKey="expense" fill="#f97316" />
            </BarChart>
          </div>

          {/* LINE CHART */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Income vs Expense Trend
            </h3>

            <LineChart width={450} height={260} data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  borderColor: "#1e293b",
                  color: "#e5e7eb",
                }}
              />
              <Legend />

              <Line
                type="monotone"
                dataKey="income"
                stroke="#22c55e"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#f97316"
                strokeWidth={2}
              />
            </LineChart>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-30">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-96 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit Transaction</h2>

            <div className="space-y-3">
              <input
                type="number"
                value={editData.amount}
                onChange={(e) =>
                  setEditData({ ...editData, amount: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              />

              <input
                type="text"
                value={editData.category}
                onChange={(e) =>
                  setEditData({ ...editData, category: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              />

              <input
                type="text"
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              />

              <select
                value={editData.type}
                onChange={(e) =>
                  setEditData({ ...editData, type: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <input
                type="date"
                value={editData.date}
                onChange={(e) =>
                  setEditData({ ...editData, date: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
