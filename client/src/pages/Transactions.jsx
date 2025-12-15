// =========================
//  Transactions.jsx (UPDATED)
// =========================

import { useEffect, useState } from "react";
import axios from "axios";
import { formatPrettyDate } from "../utils/dateUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ FIXED PDF IMPORT

export default function Transactions() {
  const token = localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ============================
  // Fetch Data
  // ============================
  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses/all", {
        headers: { Authorization: `Bearer ${token}` },
        params: { type, category, startDate, endDate, search },
      });

      setTransactions(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.log("Error loading transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [type, category, startDate, endDate]);

  useEffect(() => {
    let data = transactions;

    if (search) {
      data = data.filter((t) =>
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(data);
    setPage(1);
  }, [search, transactions]);

  // ============================
  // EXPORT CSV
  // ============================
  const downloadCSV = () => {
    if (!filtered.length) return alert("No transactions to export!");

    const headers = ["Date", "Description", "Category", "Type", "Amount (₹)"];

    const rows = filtered.map((t) => [
      formatPrettyDate(t.date),
      t.description,
      t.category,
      t.type,
      t.amount,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "transactions.csv";
    link.click();
  };

  // ============================
  // EXPORT PDF
  // ============================
  const downloadPDF = () => {
    if (!filtered.length) return alert("No transactions to export!");

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Transaction Report", 14, 15);

    const tableColumn = ["Date", "Description", "Category", "Type", "Amount (₹)"];
    const tableRows = filtered.map((t) => [
      formatPrettyDate(t.date),
      t.description,
      t.category,
      t.type,
      t.amount,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
    });

    doc.save("transactions.pdf");
  };

  // ============================
  // Pagination
  // ============================
  const startIndex = (page - 1) * itemsPerPage;
  const currentPageData = filtered.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">All Transactions</h1>
            <p className="text-slate-400 text-sm">
              Explore, filter, and export your full transaction history.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* EXPORT DROPDOWN BUTTON */}
        <div className="relative inline-block mb-6">
          <button
            className="px-4 py-2 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500"
            onClick={() => {
              const menu = document.getElementById("exportMenu");
              menu.classList.toggle("hidden");
            }}
          >
            Export Transactions ▾
          </button>

          {/* Dropdown */}
          <div
            id="exportMenu"
            className="hidden absolute mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-lg"
          >
            <button
              onClick={downloadCSV}
              className="block w-full px-4 py-2 text-left hover:bg-slate-800"
            >
              Export as CSV
            </button>
            <button
              onClick={downloadPDF}
              className="block w-full px-4 py-2 text-left hover:bg-slate-800"
            >
              Export as PDF
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
          >
            <option value="all">All Categories</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Clothes">Clothes</option>
            <option value="Gift">Gift</option>
            <option value="Salary">Salary</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
          />
        </div>

        {/* SEARCH */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-5">
          <input
            type="text"
            placeholder="Search by description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2"
          />
        </div>

        {/* TABLE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 text-left text-slate-400">Date</th>
                <th className="p-3 text-left text-slate-400">Description</th>
                <th className="p-3 text-left text-slate-400">Category</th>
                <th className="p-3 text-left text-slate-400">Type</th>
                <th className="p-3 text-left text-slate-400">Amount</th>
              </tr>
            </thead>

            <tbody>
              {currentPageData.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-800">
                  <td className="p-3">{formatPrettyDate(tx.date)}</td>
                  <td className="p-3">{tx.description}</td>
                  <td className="p-3">{tx.category}</td>
                  <td className="p-3 capitalize">{tx.type}</td>
                  <td
                    className={`p-3 font-semibold ${
                      tx.type === "income"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    ₹ {tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div className="flex justify-center mt-4 gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40"
            >
              Prev
            </button>

            <span>Page {page} of {totalPages || 1}</span>

            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-800 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
