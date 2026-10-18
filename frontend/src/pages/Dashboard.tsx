import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDashboard } from "../api/client";
import type { BudgetStatus, DashboardData } from "../types";
import { currentMonth, formatMoney } from "../utils/format";

function monthTitle(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function trackLabel(status: BudgetStatus) {
  if (status === "within") return "On track";
  if (status === "approaching") return "Near limit";
  if (status === "over") return "Over budget";
  return "No budget";
}

function monthChange(spent: number, previous: number) {
  if (previous === 0 && spent === 0) return { text: "Same as last month", tone: "flat" };
  if (previous === 0) return { text: "New spending this month", tone: "up" };
  const pct = Math.round(((spent - previous) / previous) * 100);
  if (pct > 0) return { text: `+${pct}% vs last month`, tone: "up" };
  if (pct < 0) return { text: `${pct}% vs last month`, tone: "down" };
  return { text: "Same as last month", tone: "flat" };
}

function monthFromUrl(value: string | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

export function Dashboard() {
  const [params] = useSearchParams();
  const [month, setMonth] = useState(() => monthFromUrl(params.get("month")));
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMonth(monthFromUrl(params.get("month")));
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    getDashboard(month)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const hasBudget = data?.budgetAmount !== null && (data?.budgetAmount ?? 0) > 0;
  const used = hasBudget && data ? Math.min((data.totalSpent / data.budgetAmount!) * 100, 100) : 0;
  const change = data ? monthChange(data.totalSpent, data.previousSpent ?? 0) : null;
  const largest = Math.max(...(data?.spendingByCategory.map((row) => row.total) ?? [1]), 1);

  return (
    <section className="dash">
      <div className="dash-head">
        <div>
          <p className="dash-kicker">Welcome back</p>
          <h1>Your money, in perspective.</h1>
          <p className="dash-line">Small steps. Better choices. A brighter future.</p>
        </div>
        <label className="dash-month">
          {monthTitle(month)}
          <input type="month" value={month} aria-label="Month" onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {data && (
        <>
          <div className="dash-stats">
            <article className="dash-card">
              <p className="dash-kicker">Monthly budget</p>
              <p className="dash-money">
                {formatMoney(data.totalSpent)}
                <span>{hasBudget ? ` of ${formatMoney(data.budgetAmount)}` : ""}</span>
              </p>
              <div className="dash-track"><span style={{ width: `${used}%` }} /></div>
              <div className="dash-budget-foot">
                <span>{hasBudget ? `${formatMoney(data.remaining)} remaining` : "No budget set"}</span>
                <em className={`dash-pill status-${data.status}`}>{trackLabel(data.status)}</em>
              </div>
            </article>
            <article className="dash-card">
              <p className="dash-kicker">Spent this month</p>
              <p className="dash-money">{formatMoney(data.totalSpent)}</p>
              {change && <p className={`dash-change ${change.tone}`}>{change.text}</p>}
            </article>
            <article className="dash-card">
              <p className="dash-kicker">Biggest expense</p>
              <p className="dash-money">{data.highestExpense ? formatMoney(data.highestExpense.amount) : formatMoney(0)}</p>
              <p className="dash-sub">{data.highestExpense ? data.highestExpense.categoryName : "None yet"}</p>
            </article>
            <article className="dash-card">
              <p className="dash-kicker">Transactions</p>
              <p className="dash-money">{data.expenseCount ?? data.recentExpenses.length}</p>
              <p className="dash-sub">this month</p>
            </article>
          </div>

          <div className="dash-split">
            <article className="dash-card">
              <p className="dash-kicker">Spending by category</p>
              {data.spendingByCategory.length === 0 && <p className="dash-sub">No spending this month.</p>}
              <div className="dash-cats">
                {data.spendingByCategory.map((row) => (
                  <div className="dash-cat" key={row.categoryId}>
                    <span>{row.name}</span>
                    <div className="dash-bar"><i style={{ width: `${(row.total / largest) * 100}%` }} /></div>
                    <strong>{formatMoney(row.total)}</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className="dash-card">
              <div className="dash-card-head">
                <p className="dash-kicker">Recent expenses</p>
                <Link to="/expenses">View all</Link>
              </div>
              {data.recentExpenses.length === 0 && <p className="dash-sub">No expenses this month.</p>}
              {data.recentExpenses.length > 0 && (
                <div className="dash-table">
                  <div className="dash-table-head">
                    <span>Date</span>
                    <span>Expense</span>
                    <span>Category</span>
                    <span>Payment</span>
                    <span>Amount</span>
                  </div>
                  {data.recentExpenses.map((expense) => (
                    <div className="dash-table-row" key={expense._id}>
                      <span data-label="Date">{shortDate(expense.date)}</span>
                      <span data-label="Expense">{expense.title}</span>
                      <span data-label="Category">{expense.categoryName}</span>
                      <span data-label="Payment">{expense.paymentMethod}</span>
                      <strong data-label="Amount">{formatMoney(expense.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
          <p className="dash-foot">A clearer view of your money starts with one small habit.</p>
        </>
      )}
    </section>
  );
}
