import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminInsights } from "../api/client";
import type { AdminInsights } from "../types";
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

export function AdminInsights() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<AdminInsights | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setError("");
    getAdminInsights(month)
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

  const spent = data?.spendingPerCategory ?? [];
  const largest = Math.max(...spent.map((row) => row.total), 1);
  const totalSpent = spent.reduce((sum, row) => sum + row.total, 0);

  return (
    <section className="admin">
      <header className="admin-intro">
        <div>
          <p className="admin-kicker">Platform control</p>
          <h1>Admin overview</h1>
          <p className="admin-line">A clear view of Retain activity, spending, and category health.</p>
        </div>
        <div className="admin-tools">
          <Link className="admin-pill" to="/admin/categories">Manage categories</Link>
          <label className="admin-month">
            {monthTitle(month)}
            <input type="month" value={month} aria-label="Month" onChange={(event) => setMonth(event.target.value)} />
          </label>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="admin-line">Loading…</p>}

      {data && (
        <>
          <div className="admin-stats">
            <article className="admin-card">
              <p className="admin-kicker">Platform users</p>
              <p className="admin-stat">{data.totalUsers.toLocaleString("en-US")}</p>
              <p className="admin-sub">All platform accounts</p>
            </article>
            <article className="admin-card">
              <p className="admin-kicker">Total expenses</p>
              <p className="admin-stat">{data.totalExpenses.toLocaleString("en-US")}</p>
              <p className="admin-sub">All recorded transactions</p>
            </article>
            <article className="admin-card">
              <p className="admin-kicker">Total value</p>
              <p className="admin-stat">{formatMoney(data.totalValue)}</p>
              <p className="admin-sub">Across all users</p>
            </article>
            <article className="admin-card">
              <p className="admin-kicker">Expenses this month</p>
              <p className="admin-stat">{data.expensesThisMonth.toLocaleString("en-US")}</p>
              <p className="admin-sub">Current calendar month</p>
            </article>
          </div>

          <div className="admin-split">
            <article className="admin-card">
              <p className="admin-kicker">Spending by category</p>
              <h2>Where money is being spent</h2>
              {spent.length === 0 && <p className="admin-sub">No categories yet.</p>}
              <div className="admin-bars">
                {spent.map((row) => {
                  const share = totalSpent > 0 ? Math.round((row.total / totalSpent) * 100) : 0;
                  return (
                    <div className="admin-bar" key={row.name}>
                      <span>{row.name}</span>
                      <div className="admin-track"><i style={{ width: `${(row.total / largest) * 100}%` }} /></div>
                      <strong>{share}%</strong>
                      <em>{formatMoney(row.total)}</em>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="admin-card">
              <p className="admin-kicker">Category usage</p>
              <h2>Most and least used</h2>
              <div className="admin-usage">
                <div>
                  <p className="admin-use-label">Most used</p>
                  {data.topCategories.map((row) => (
                    <div className="admin-use" key={`top-${row.name}`}>
                      <span>{row.name}</span>
                      <strong>{row.count.toLocaleString("en-US")}</strong>
                      <em className={row.isDefault ? "tag tag-default" : "tag tag-edit"}>{row.isDefault ? "Default" : "Editable"}</em>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="admin-use-label">Least used</p>
                  {data.bottomCategories.map((row) => (
                    <div className="admin-use" key={`low-${row.name}`}>
                      <span>{row.name}</span>
                      <strong>{row.count.toLocaleString("en-US")}</strong>
                      <em className={row.isDefault ? "tag tag-default" : "tag tag-edit"}>{row.isDefault ? "Default" : "Editable"}</em>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="admin-split">
            <article className="admin-card">
              <p className="admin-kicker">Latest transactions across Retain</p>
              <div className="admin-table">
                <div className="admin-row admin-head">
                  <span>User</span>
                  <span>Expense</span>
                  <span>Date</span>
                  <span>Amount</span>
                </div>
                {data.recentExpenses.length === 0 && <p className="admin-sub">No expenses yet.</p>}
                {data.recentExpenses.map((row) => (
                  <div className="admin-row" key={row._id}>
                    <span data-label="User">{row.ownerEmail || row.ownerName}</span>
                    <span data-label="Expense">{row.title}</span>
                    <span data-label="Date">{shortDate(row.date)}</span>
                    <strong data-label="Amount">{formatMoney(row.amount)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-card">
              <p className="admin-kicker">Recently registered users</p>
              <div className="admin-table">
                <div className="admin-row users admin-head">
                  <span>User</span>
                  <span>Joined</span>
                  <span>Status</span>
                </div>
                {data.recentUsers.map((person) => (
                  <div className="admin-row users" key={person._id}>
                    <span data-label="User">{person.email}</span>
                    <span data-label="Joined">{shortDate(person.createdAt)}</span>
                    <em data-label="Status" className={person.role === "admin" ? "tag tag-admin" : "tag tag-active"}>
                      {person.role === "admin" ? "Admin" : "Active"}
                    </em>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <p className="admin-foot">Showing live data. All counts come from the database.</p>
        </>
      )}
    </section>
  );
}
