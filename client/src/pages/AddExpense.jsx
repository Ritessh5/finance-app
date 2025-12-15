// src/pages/AddExpense.jsx
import { useState } from "react";
import axios from "axios";

export default function AddExpense() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: "",
    type: "expense",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:5000/api/expenses", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Transaction added successfully!");
      setForm({
        amount: "",
        category: "",
        description: "",
        date: "",
        type: "expense",
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add transaction.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Add Transaction</h1>
            <p className="text-slate-400 text-sm">
              Log an income or expense to keep your analytics updated.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {message && (
            <div className="mb-4 text-sm text-indigo-300 bg-slate-800/60 border border-indigo-500/40 px-3 py-2 rounded-md">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm text-slate-300">Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Food, Rent, Salary…"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-300">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-sm text-slate-300">Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short note about this transaction"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold"
              >
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
