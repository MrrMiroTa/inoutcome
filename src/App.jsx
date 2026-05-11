// Income & Outcome Tracker App
// Clean classic responsive design for mobile + desktop

import { useState, useEffect, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dollar from "./assets/dollar.png";
import money from "./assets/money.png";

const USD_TO_RIEL = 4000;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatNumber(num) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRiel(num) {
  return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function loadEntries() {
  try {
    const data = localStorage.getItem("inoutcome_entries");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

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
      className="form-card"
    >
      <h2 className="form-title">
        {editingEntry ? (
          <><span className="form-title-icon">&#9998;</span> Edit Entry</>
        ) : (
          <><span className="form-title-icon">&#43;</span> Add New Entry</>
        )}
      </h2>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Type</label>
          <div className="type-toggle">
             <button
               type="button"
               onClick={() => setType("income")}
               className={`type-btn type-income ${type === "income" ? "active" : ""}`}
             >
               <img src={money} alt="income" title="income" className="type-icon" />
               Income
             </button>
             <button
               type="button"
               onClick={() => setType("outcome")}
               className={`type-btn type-outcome ${type === "outcome" ? "active" : ""}`}
             >
               <img src={dollar} alt="outcome" title="outcome" className="type-icon" />
               Outcome
             </button>
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Salary, Food, Rent..."
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-field">
          <label className="form-label" htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="form-select"
          >
            <option value="USD">USD</option>
            <option value="KHR">KHR (Riel)</option>
          </select>
        </div>
      </div>

      <div className="form-row form-row--2">
        <div className="form-field">
          <label className="form-label" htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="form-input"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editingEntry ? "Update Entry" : "Add Entry"}
        </button>
        {editingEntry && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── SUBCOMPONENT: BalanceCard ───────────────────────────────────────────────
function BalanceCard({ entries, selectedDate, currency }) {
  const filtered = entries.filter((e) => e.date === selectedDate);
  const incomeEntries = filtered.filter((e) => e.type === "income");
  const outcomeEntries = filtered.filter((e) => e.type === "outcome");

  const incomeUSD = incomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
  const incomeKHR = incomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);
  const outcomeUSD = outcomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
  const outcomeKHR = outcomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);

  const totalIncomeUSD = incomeUSD + incomeKHR / USD_TO_RIEL;
  const totalOutcomeUSD = outcomeUSD + outcomeKHR / USD_TO_RIEL;
  const balanceUSD = totalIncomeUSD - totalOutcomeUSD;
  const totalIncomeKHR = incomeUSD * USD_TO_RIEL + incomeKHR;
  const totalOutcomeKHR = outcomeUSD * USD_TO_RIEL + outcomeKHR;
  const balanceKHR = totalIncomeKHR - totalOutcomeKHR;

  const displayIncome = currency === "USD"
    ? "$" + formatNumber(totalIncomeUSD)
    : "KHR " + formatRiel(totalIncomeKHR);
  const displayOutcome = currency === "USD"
    ? "$" + formatNumber(totalOutcomeUSD)
    : "KHR " + formatRiel(totalOutcomeKHR);
  const displayBalance = currency === "USD"
    ? (balanceUSD >= 0 ? "+" : "") + "$" + formatNumber(Math.abs(balanceUSD))
    : (balanceKHR >= 0 ? "+" : "") + "KHR " + formatRiel(Math.abs(balanceKHR));
  const balancePositive = balanceUSD >= 0;

  return (
    <div className="stats-grid">
      <div className="stat-card stat-income">
        <div className="stat-label">Total Income</div>
        <div className="stat-value">{displayIncome}</div>
        <div className="stat-sub">
          USD: ${formatNumber(totalIncomeUSD)} | KHR: KHR {formatRiel(totalIncomeKHR)}
        </div>
      </div>

      <div className="stat-card stat-outcome">
        <div className="stat-label">Total Outcome</div>
        <div className="stat-value">{displayOutcome}</div>
        <div className="stat-sub">
          USD: ${formatNumber(totalOutcomeUSD)} | KHR: KHR {formatRiel(totalOutcomeKHR)}
        </div>
      </div>

      <div className={`stat-card stat-balance ${balancePositive ? "positive" : "negative"}`}>
        <div className="stat-label">Balance</div>
        <div className="stat-value">{displayBalance}</div>
        <div className="stat-sub">
          USD: {balanceUSD >= 0 ? "+" : ""}${formatNumber(Math.abs(balanceUSD))} |{" "}
          KHR: {balanceKHR >= 0 ? "+" : ""}KHR {formatRiel(Math.abs(balanceKHR))}
        </div>
      </div>

      <div className="stat-card stat-count">
        <div className="stat-label">Transactions</div>
        <div className="stat-value">{filtered.length}</div>
        <div className="stat-sub">
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
      <div className="empty-state">
        <div className="empty-icon">&#128466;</div>
        <p className="empty-text">No transactions for this date</p>
        <p className="empty-sub">Add your first entry using the form above.</p>
      </div>
    );
  }

  return (
    <div className="list-card">
      <div className="list-header">
        <h3 className="list-title">Transactions for {selectedDate}</h3>
        <span className="list-count">{filtered.length} entries</span>
      </div>
      <div className="list-body">
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
  const convertedAmount = entry.currency === "USD" ? entry.amount : entry.amount / USD_TO_RIEL;

  const originalStr = entry.currency === "USD"
    ? "$ " + formatNumber(entry.amount)
    : "KHR " + formatRiel(entry.amount);

  const usdEquiv = entry.currency === "USD"
    ? "$ " + formatNumber(entry.amount)
    : "$ " + formatNumber(convertedAmount);

   return (
     <div className="transaction-row">
       <div className="tx-icon tx-icon--income">
         {isIncome ? (
           <img src={money} alt="money" title="money icons" />
         ) : (
           <img src={dollar} alt="dollar" title="expense icons" />
         )}
       </div>
      <div className="tx-info">
        <div className="tx-desc">{entry.description}</div>
        <div className="tx-meta">
          <span className={`tx-badge ${isIncome ? "tx-badge--income" : "tx-badge--outcome"}`}>
            {isIncome ? "Income" : "Outcome"}
          </span>
          <span className="tx-currency">{originalStr}</span>
        </div>
        <div className="tx-sub">
          {currency === "USD" && entry.currency === "KHR" && (
            <span className="tx-convert">~{usdEquiv} USD</span>
          )}
          {currency === "KHR" && entry.currency === "USD" && (
            <span className="tx-convert">~KHR {(convertedAmount * USD_TO_RIEL).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          )}
        </div>
      </div>
      <div className="tx-amount">
        <span className="tx-amount-num">
          {isIncome ? "+" : "-"}{currency === "USD" ? "$" : "KHR "}{formatNumber(currency === "USD"
            ? (entry.currency === "USD" ? entry.amount : convertedAmount)
            : (entry.currency === "KHR" ? entry.amount : entry.amount * USD_TO_RIEL))}
        </span>
      </div>
      <div className="tx-actions">
        <button onClick={() => onEdit(entry)} className="tx-btn tx-btn--edit" title="Edit">&#9998;</button>
        <button onClick={() => onDelete(entry.id)} className="tx-btn tx-btn--delete" title="Delete">&#128465;</button>
      </div>
    </div>
  );
}

// ─── SUBCOMPONENT: AllDaysSummary ───────────────────────────────────────────
function AllDaysSummary({ entries, currency }) {
  const incomeEntries = entries.filter((e) => e.type === "income");
  const outcomeEntries = entries.filter((e) => e.type === "outcome");

  const incomeUSD = incomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
  const incomeKHR = incomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);
  const outcomeUSD = outcomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
  const outcomeKHR = outcomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);

  const totalIncomeUSD = incomeUSD + incomeKHR / USD_TO_RIEL;
  const totalOutcomeUSD = outcomeUSD + outcomeKHR / USD_TO_RIEL;
  const balanceUSD = totalIncomeUSD - totalOutcomeUSD;
  const totalIncomeKHR = incomeUSD * USD_TO_RIEL + incomeKHR;
  const totalOutcomeKHR = outcomeUSD * USD_TO_RIEL + outcomeKHR;
  const balanceKHR = totalIncomeKHR - totalOutcomeKHR;

  const uniqueDates = [...new Set(entries.map((e) => e.date))].length;

  const displayIncome = currency === "USD"
    ? "$" + formatNumber(totalIncomeUSD)
    : "KHR " + formatRiel(totalIncomeKHR);
  const displayOutcome = currency === "USD"
    ? "$" + formatNumber(totalOutcomeUSD)
    : "KHR " + formatRiel(totalOutcomeKHR);
  const displayBalance = currency === "USD"
    ? (balanceUSD >= 0 ? "+" : "") + "$" + formatNumber(Math.abs(balanceUSD))
    : (balanceKHR >= 0 ? "+" : "") + "KHR " + formatRiel(Math.abs(balanceKHR));
  const balancePositive = balanceUSD >= 0;

  return (
    <div className="stats-grid">
      <div className="stat-card stat-income">
        <div className="stat-label">All Income</div>
        <div className="stat-value">{displayIncome}</div>
        <div className="stat-sub">
          USD: ${formatNumber(totalIncomeUSD)} | KHR: KHR {formatRiel(totalIncomeKHR)}
        </div>
      </div>

      <div className="stat-card stat-outcome">
        <div className="stat-label">All Outcome</div>
        <div className="stat-value">{displayOutcome}</div>
        <div className="stat-sub">
          USD: ${formatNumber(totalOutcomeUSD)} | KHR: KHR {formatRiel(totalOutcomeKHR)}
        </div>
      </div>

      <div className={`stat-card stat-balance ${balancePositive ? "positive" : "negative"}`}>
        <div className="stat-label">All Balance</div>
        <div className="stat-value">{displayBalance}</div>
        <div className="stat-sub">
          USD: {balanceUSD >= 0 ? "+" : ""}${formatNumber(Math.abs(balanceUSD))} |{" "}
          KHR: {balanceKHR >= 0 ? "+" : ""}KHR {formatRiel(Math.abs(balanceKHR))}
        </div>
      </div>

      <div className="stat-card stat-count">
        <div className="stat-label">All Transactions</div>
        <div className="stat-value">{entries.length}</div>
        <div className="stat-sub">
          Days: {uniqueDates} | Income: {incomeEntries.length} | Outcome: {outcomeEntries.length}
        </div>
      </div>
    </div>
  );
}

function AllDaysTransactionList({ entries, currency, onEdit, onDelete }) {
  const sorted = entries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">&#128466;</div>
        <p className="empty-text">No transactions recorded</p>
        <p className="empty-sub">Add your first entry using the form above.</p>
      </div>
    );
  }

  return (
    <div className="list-card">
      <div className="list-header">
        <h3 className="list-title">All Transactions</h3>
        <span className="list-count">{sorted.length} entries</span>
      </div>
      <div className="list-body">
        {sorted.map((entry) => (
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

// ─── MAIN: App Component ─────────────────────────────────────────────────────
export default function App() {
  const [entries, setEntries] = useState(loadEntries);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("USD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showAllDays, setShowAllDays] = useState(false);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 500);
    }, 30000);
    return () => clearInterval(refreshTimerRef.current);
  }, []);

  const handleSubmit = useCallback(
    (entry) => {
      if (editingEntry) {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
      } else {
        setEntries((prev) => [...prev, { ...entry, createdAt: new Date().toISOString() }]);
      }
      setEditingEntry(null);
    },
    [editingEntry]
  );

  const handleDelete = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleEdit = useCallback((entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCancel = useCallback(() => {
    setEditingEntry(null);
  }, []);

   const handleExportPDF = useCallback(() => {
     const doc = new jsPDF("landscape", "mm", "a4");

     doc.setFontSize(22);
     doc.setTextColor(30, 58, 138);
     doc.text("Income & Outcome Report", 148, 20, { align: "center" });

     doc.setFontSize(10);
     doc.setTextColor(120);
     doc.text("Generated: " + new Date().toLocaleString("en-US"), 148, 28, { align: "center" });
     doc.text("Exchange Rate: 1 USD = 4,000 KHR", 148, 35, { align: "center" });

     const filtered = entries.filter((e) => e.date === selectedDate);
     const incomeEntries = filtered.filter((e) => e.type === "income");
     const outcomeEntries = filtered.filter((e) => e.type === "outcome");

     const incomeUSD = incomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
     const incomeKHR = incomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);
     const outcomeUSD = outcomeEntries.filter((e) => e.currency === "USD").reduce((s, e) => s + e.amount, 0);
     const outcomeKHR = outcomeEntries.filter((e) => e.currency === "KHR").reduce((s, e) => s + e.amount, 0);

     const totalIncomeUSD = incomeUSD + incomeKHR / USD_TO_RIEL;
     const totalOutcomeUSD = outcomeUSD + outcomeKHR / USD_TO_RIEL;
     const balanceUSD = totalIncomeUSD - totalOutcomeUSD;
     const totalIncomeKHR = incomeUSD * USD_TO_RIEL + incomeKHR;
     const totalOutcomeKHR = outcomeUSD * USD_TO_RIEL + outcomeKHR;
     const balanceKHR = totalIncomeKHR - totalOutcomeKHR;

     doc.autoTable({
       startY: 42,
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

     // Function to sanitize text for PDF (replace Khmer characters with asterisks)
     const sanitizeForPDF = (text) => {
       // Khmer Unicode range: U+1780–U+17FF
       // Replace any Khmer characters with asterisks
       return String(text).replace(/[\u1780-\u17FF]/g, '*');
     };

     const tableBody = filtered
       .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
       .map((entry) => [
         entry.type === "income" ? "Income" : "Outcome",
         sanitizeForPDF(entry.description),
         entry.currency === "USD" ? "$" + formatNumber(entry.amount) : "KHR " + formatRiel(entry.amount),
         entry.currency === "USD" ? "$" + formatNumber(entry.amount) : "$" + formatNumber(entry.amount / USD_TO_RIEL),
         entry.date,
       ]);

     doc.autoTable({
       startY: doc.lastAutoTable.finalY + 10,
       head: [["Type", "Description", "Original", "USD Equiv", "Date"]],
       body: tableBody,
       styles: { fontSize: 9, cellPadding: 3 },
       headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
       alternateRowStyles: { fillColor: [245, 248, 255] },
     });

     doc.setFontSize(8);
     doc.setTextColor(150);
     doc.text("In-Outcome Tracker | " + new Date().toLocaleDateString("en-US") + " | Page " + doc.internal.getNumberOfPages(), 148, doc.internal.pageSize.height - 10, { align: "center" });

     doc.save("inoutcome-report-" + selectedDate + ".pdf");
   }, [entries, selectedDate]);

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
           <div className="header-left">
             <h1 className="app-title">
               <img src={money} alt="income" title="income" className="header-icon" />
               In-Out Tracker
             </h1>
             <p className="app-subtitle">Track your income and outcome daily</p>
           </div>
          <div className="header-right">
            <div className="header-controls">
              <label className="currency-label">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select">
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>
            <div className="refresh-badge">
              <span className={`refresh-dot ${isRefreshing ? "active" : ""}`}></span>
              <span className="refresh-text">{isRefreshing ? "Updated" : "Auto 30s"}</span>
            </div>
            <button onClick={handleExportPDF} className="export-btn" title="Export to PDF">
              <span className="export-icon">&#128196;</span>
              <span className="export-text">PDF</span>
            </button>
          </div>
        </div>
      </header>

<main className="app-main">
         {/* Date Selector */}
         <div className="date-bar">
           <label className="date-label">Date</label>
           <div className="date-controls">
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input cusor-pointer" />
             <div className="date-shortcuts">
               <button onClick={() => { setSelectedDate(today); setShowAllDays(false); }} className={`date-btn ${!showAllDays && selectedDate === today ? "active" : ""}`}>Today</button>
               <button onClick={() => { setSelectedDate(yesterday); setShowAllDays(false); }} className={`date-btn ${!showAllDays && selectedDate === yesterday ? "active" : ""}`}>Yesterday</button>
               <button onClick={() => setShowAllDays(true)} className={`date-btn ${showAllDays ? "active" : ""}`}>All Day</button>
             </div>
           </div>
           <p className="date-info">1 USD = 4,000 KHR &bull; Auto-refresh every 30s</p>
         </div>

         {showAllDays ? (
           <>
             {/* All Days Summary */}
             <AllDaysSummary entries={entries} currency={currency} />

             {/* All Days Transaction List */}
             <AllDaysTransactionList
               entries={entries}
               currency={currency}
               onEdit={handleEdit}
               onDelete={handleDelete}
             />
           </>
         ) : (
           <>
             {/* Balance Cards */}
             <BalanceCard entries={entries} selectedDate={selectedDate} currency={currency} />

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
           </>
         )}
       </main>

      <footer className="app-footer">
        In-Outcome Tracker By Uzita &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}