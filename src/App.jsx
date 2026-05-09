// Income & Outcome Tracker App
// Main App Component with full state management, currency conversion, auto-refresh,
// CRUD operations for income/outcome entries, daily filtering, and PDF export.

import { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Exchange rate: 1 USD = 4000 KHR (Cambodian Riel)
const USD_TO_RIEL = 4000;

// Utility: generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Utility: format number with commas
function formatNumber(num) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Utility: format Riel number with commas
function formatRiel(num) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Load from localStorage
function loadEntries() {
  try {
    const data = localStorage.getItem("inoutcome_entries");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveEntries(entries) {
  localStorage.setItem("inoutcome_entries", JSON.stringify(entries));
}

// ─── SUBCOMPONENT: TransactionForm ───────────────────────────────────────────
function TransactionForm({ onSubmit, editingEntry, onCancel }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [type, setType] = useState("income");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editingEntry) {
      setDescription(editingEntry.description);
      setAmount(editingEntry.amount.toString());
      setCurrency(editingEntry.currency);
      setType(editingEntry.type);
      setDate(editingEntry.date);
    } else {
      resetForm();
    }
  }, [editingEntry]);

  function resetForm() {
    setDescription("");
    setAmount("");
    setCurrency("USD");
    setType("income");
    setDate(new Date().toISOString().split("T")[0]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    onSubmit({
      id: editingEntry ? editingEntry.id : generateId(),
      description: description.trim(),
      amount: parsed,
      currency,
      type,
      date,
    });
    resetForm();
    if (editingEntry && onCancel) onCancel();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {editingEntry ? "Edit Entry" : "+ Add New Entry"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type Selector */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                type === "income"
                  ? "bg-green-600 text-white shadow-lg shadow-green-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("outcome")}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                type === "outcome"
                  ? "bg-red-500 text-white shadow-lg shadow-red-200"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Outcome
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Salary, Food, Rent, Business..."
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base appearance-none cursor-pointer"
          >
            <option value="USD">USD</option>
            <option value="KHR">KHR (Riel)</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
          />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
          >
            {editingEntry ? "Update Entry" : "Add Entry"}
          </button>
          {editingEntry && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// ─── SUBCOMPONENT: BalanceCard ───────────────────────────────────────────────
function BalanceCard({ entries, selectedDate, currency }) {
  const filtered = entries.filter((e) => e.date === selectedDate);
  const incomeEntries = filtered.filter((e) => e.type === "income");
  const outcomeEntries = filtered.filter((e) => e.type === "outcome");

  const incomeUSD = incomeEntries
    .filter((e) => e.currency === "USD")
    .reduce((s, e) => s + e.amount, 0);
  const incomeKHR = incomeEntries
    .filter((e) => e.currency === "KHR")
    .reduce((s, e) => s + e.amount, 0);

  const outcomeUSD = outcomeEntries
    .filter((e) => e.currency === "USD")
    .reduce((s, e) => s + e.amount, 0);
  const outcomeKHR = outcomeEntries
    .filter((e) => e.currency === "KHR")
    .reduce((s, e) => s + e.amount, 0);

  // Convert everything to USD for display
  let totalIncomeUSD = incomeUSD + incomeKHR / USD_TO_RIEL;
  let totalOutcomeUSD = outcomeUSD + outcomeKHR / USD_TO_RIEL;
  let balanceUSD = totalIncomeUSD - totalOutcomeUSD;

  // Convert everything to KHR for display
  let totalIncomeKHR = incomeUSD * USD_TO_RIEL + incomeKHR;
  let totalOutcomeKHR = outcomeUSD * USD_TO_RIEL + outcomeKHR;
  let balanceKHR = totalIncomeKHR - totalOutcomeKHR;

  const cardClass =
    "bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 md:p-6 border border-gray-200 dark:border-gray-700";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Income */}
      <div className={cardClass}>
        <div className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
          Total Income
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
          {currency === "USD"
            ? "$" + formatNumber(totalIncomeUSD)
            : "KHR " + formatRiel(totalIncomeKHR)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          USD: ${formatNumber(totalIncomeUSD)} | KHR: KHR {formatRiel(totalIncomeKHR)}
        </div>
      </div>

      {/* Total Outcome */}
      <div className={cardClass}>
        <div className="text-sm font-medium text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
          Total Outcome
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
          {currency === "USD"
            ? "$" + formatNumber(totalOutcomeUSD)
            : "KHR " + formatRiel(totalOutcomeKHR)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          USD: ${formatNumber(totalOutcomeUSD)} | KHR: KHR {formatRiel(totalOutcomeKHR)}
        </div>
      </div>

      {/* Balance */}
      <div className={`${cardClass} ${balanceUSD >= 0 ? "border-green-400/30" : "border-red-400/30"}`}>
        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
          Balance
        </div>
        <div
          className={`text-2xl md:text-3xl font-extrabold ${
            balanceUSD >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
          }`}
        >
          {currency === "USD"
            ? (balanceUSD >= 0 ? "+" : "") + "$" + formatNumber(Math.abs(balanceUSD))
            : (balanceKHR >= 0 ? "+" : "") + "KHR " + formatRiel(Math.abs(balanceKHR))}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          USD: {balanceUSD >= 0 ? "+" : ""}${formatNumber(Math.abs(balanceUSD))} | KHR:{" "}
          {balanceKHR >= 0 ? "+" : ""}KHR {formatRiel(Math.abs(balanceKHR))}
        </div>
      </div>

      {/* Entry Count */}
      <div className={cardClass}>
        <div className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
          Transactions
        </div>
        <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
          {filtered.length}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Income: {incomeEntries.length} | Outcome: {outcomeEntries.length}
        </div>
      </div>
    </div>
  );
}

// ─── SUBCOMPONENT: TransactionList ───────────────────────────────────────────
function TransactionList({ entries, selectedDate, onEdit, onDelete, currency }) {
  const filtered = entries
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-5xl mb-4">No Data</div>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          No transactions for this date
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Add your first entry above!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Transactions for {selectedDate}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({filtered.length} entries)
          </span>
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
        {filtered.map((entry) => (
          <TransactionItem
            key={entry.id}
            entry={entry}
            currency={currency}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SUBCOMPONENT: TransactionItem ───────────────────────────────────────────
function TransactionItem({ entry, currency, onEdit, onDelete }) {
  const isIncome = entry.type === "income";
  const convertedAmount =
    entry.currency === "USD" ? entry.amount : entry.amount / USD_TO_RIEL;

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            isIncome
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400"
          }`}
        >
          {isIncome ? "Income" : "Outcome"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {entry.description}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isIncome
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {isIncome ? "Income" : "Outcome"}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className="hidden sm:inline">
              {entry.currency === "USD" ? "USD" : "KHR"}
            </span>
            <span className="mx-1 hidden sm:inline">-</span>
            <span>
              {entry.currency === "USD"
                ? "$ " + formatNumber(entry.amount)
                : "KHR " + formatRiel(entry.amount)}
            </span>
            {currency === "USD" && entry.currency === "KHR" && (
              <span className="text-gray-400 dark:text-gray-500 ml-1">
                (~${formatNumber(convertedAmount)})
              </span>
            )}
            {currency === "KHR" && entry.currency === "USD" && (
              <span className="text-gray-400 dark:text-gray-500 ml-1">
                (~$KHR {formatRiel(convertedAmount * USD_TO_RIEL)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(entry)}
          className="p-2 text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
          title="Delete"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── MAIN: App Component ─────────────────────────────────────────────────────
export default function App() {
  const [entries, setEntries] = useState(loadEntries);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("USD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const refreshTimerRef = useRef(null);

  // Load from localStorage whenever entries change
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  // Auto-refresh every 30 seconds (re-renders current state — for live feel)
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }, 30000);
    return () => clearInterval(refreshTimerRef.current);
  }, []);

  // Handle submit (create or update)
  const handleSubmit = useCallback(
    (entry) => {
      if (editingEntry) {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
      } else {
        setEntries((prev) => [
          ...prev,
          { ...entry, createdAt: new Date().toISOString() },
        ]);
      }
      setEditingEntry(null);
    },
    [editingEntry]
  );

  // Handle delete
  const handleDelete = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Handle edit
  const handleEdit = useCallback((entry) => {
    setEditingEntry(entry);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditingEntry(null);
  }, []);

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF("landscape", "mm", "a4");

    // Title
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text("Income & Outcome Report", 148, 18, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Generated on: " + new Date().toLocaleString("en-US"), 148, 26, {
      align: "center",
    });
    doc.text("Exchange Rate: 1 USD = 4,000 KHR", 148, 33, {
      align: "center",
    });

    // Filter entries for selected date
    const filtered = entries.filter((e) => e.date === selectedDate);
    const incomeEntries = filtered.filter((e) => e.type === "income");
    const outcomeEntries = filtered.filter((e) => e.type === "outcome");

    const incomeUSD = incomeEntries
      .filter((e) => e.currency === "USD")
      .reduce((s, e) => s + e.amount, 0);
    const incomeKHR = incomeEntries
      .filter((e) => e.currency === "KHR")
      .reduce((s, e) => s + e.amount, 0);
    const outcomeUSD = outcomeEntries
      .filter((e) => e.currency === "USD")
      .reduce((s, e) => s + e.amount, 0);
    const outcomeKHR = outcomeEntries
      .filter((e) => e.currency === "KHR")
      .reduce((s, e) => s + e.amount, 0);

    const totalIncomeUSD = incomeUSD + incomeKHR / USD_TO_RIEL;
    const totalOutcomeUSD = outcomeUSD + outcomeKHR / USD_TO_RIEL;
    const balanceUSD = totalIncomeUSD - totalOutcomeUSD;
    const totalIncomeKHR = incomeUSD * USD_TO_RIEL + incomeKHR;
    const totalOutcomeKHR = outcomeUSD * USD_TO_RIEL + outcomeKHR;
    const balanceKHR = totalIncomeKHR - totalOutcomeKHR;

// Summary table
    doc.autoTable({
      startY: 40,
      head: [["Summary", "USD", "KHR"]],
      body: [
        ["Total Income", "$" + formatNumber(totalIncomeUSD), "KHR " + formatRiel(totalIncomeKHR)],
        ["Total Outcome", "$" + formatNumber(totalOutcomeUSD), "KHR " + formatRiel(totalOutcomeKHR)],
        ["Balance", (balanceUSD >= 0 ? "+" : "") + "$" + formatNumber(Math.abs(balanceUSD)), (balanceKHR >= 0 ? "+" : "") + "KHR " + formatRiel(Math.abs(balanceKHR))],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 244, 255] },
    });

    // Transaction table
    const tableBody = filtered
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((entry) => [
        entry.type === "income" ? "Income" : "Outcome",
        entry.description,
        entry.currency === "USD" ? "$" + formatNumber(entry.amount) : "KHR " + formatRiel(entry.amount),
        entry.currency === "USD" ? "$" + formatNumber(entry.amount) : "$" + formatNumber(entry.amount / USD_TO_RIEL),
        entry.date,
      ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Type", "Description", "Original Amount", "USD Equivalent", "Date"]],
      body: tableBody,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 255] },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "In-Outcome Tracker | " + new Date().toLocaleDateString("en-US") + " | Page " + doc.internal.getNumberOfPages(),
      148,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );

    doc.save("inoutcome-report-" + selectedDate + ".pdf");
  }, [entries, selectedDate]);

  // Quick date presets
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                In-Out Tracker
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                Track your income and outcome daily
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
                <label className="text-sm font-medium text-blue-100">Currency:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white/90 dark:bg-gray-800 text-gray-800 dark:text-white text-sm font-semibold rounded-lg px-3 py-1.5 border-0 focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  <option value="USD">USD</option>
                  <option value="KHR">KHR (Riel)</option>
                </select>
              </div>
              {/* Refresh indicator */}
              <div className="relative">
                <div
                  className={`text-xs px-2 py-1 rounded-full ${
                    isRefreshing ? "bg-green-500/20 text-green-200" : "bg-white/20 text-blue-200"
                  } transition-all duration-300`}
                >
                  {isRefreshing ? "Updated" : "Auto-refresh"}
                </div>
              </div>
              {/* Export PDF Button */}
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/20"
                title="Export to PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Date Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDate(today)}
                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(yesterday)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Yesterday
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Auto-refresh every 30 seconds. Exchange rate: 1 USD = 4,000 KHR
          </p>
        </div>

        {/* Balance Cards */}
        <BalanceCard entries={entries} selectedDate={selectedDate} currency={currency} />

        {/* Export PDF Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all duration-200 shadow-lg shadow-green-200/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report to PDF
          </button>
        </div>

        {/* Transaction Form */}
        <TransactionForm
          onSubmit={handleSubmit}
          editingEntry={editingEntry}
          onCancel={handleCancel}
        />

        {/* Transaction List */}
        <TransactionList
          entries={entries}
          selectedDate={selectedDate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currency={currency}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-400 dark:text-gray-500">
        In-Outcome Tracker {new Date().getFullYear()} | Built By Uzita
      </footer>
    </div>
  );
}