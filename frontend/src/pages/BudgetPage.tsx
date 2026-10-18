import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getBudget, getDashboard, saveBudget } from "../api/client";
import type { DashboardData } from "../types";
import { currentMonth, formatMoney } from "../utils/format";

function monthTitle(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function checkIn(status: DashboardData["status"], used: number) {
  const pct = Math.round(used);
  if (status === "over") {
    return {
      title: "This month is over budget.",
      line: `You've used ${pct}% of your budget.`,
    };
  }
  if (status === "approaching") {
    return {
      title: "You're close to the limit.",
      line: `You've used ${pct}% of your budget with time left in the month.`,
    };
  }
  if (status === "no-budget") {
    return {
      title: "Set your monthly budget.",
      line: "Add an amount, then this page will show what's left.",
    };
  }
  return {
    title: "You're on track.",
    line: `You've used ${pct}% of your budget with time left in the month.`,
  };
}

export function BudgetPage() {
  const navigate = useNavigate();
  const amountRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) amountRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    Promise.all([getBudget(month), getDashboard(month)])
      .then(([budget, dashboard]) => {
        if (cancelled) return;
        setAmount(budget.amount === null ? "" : String(budget.amount));
        setData(dashboard);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!amount.trim()) {
      setEditing(true);
      setError("Enter a budget amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveBudget({ month, amount: Number(amount) });
      navigate(`/?month=${month}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the budget");
    } finally {
      setSaving(false);
    }
  }

  const hasBudget = data?.budgetAmount !== null && (data?.budgetAmount ?? 0) > 0;
  const used = hasBudget && data ? (data.totalSpent / data.budgetAmount!) * 100 : 0;
  const fill = Math.min(used, 100);
  const over = data?.remaining !== null && (data?.remaining ?? 0) < 0;
  const note = data ? checkIn(data.status, used) : null;
  const spentTotal = data?.totalSpent ?? 0;
  const categories = data?.spendingByCategory ?? [];

  return (
    <section className="plan">
      <header className="plan-intro">
        <p className="plan-kicker">Your budget</p>
        <h1>Plan today. Freedom tomorrow.</h1>
        <p className="plan-line">Set a monthly budget that works for your real life.</p>
      </header>

      <form className="plan-grid" onSubmit={handleSubmit}>
        <div className="plan-side">
          <article className="plan-card">
            <div className="plan-card-head">
              <p className="plan-kicker">Monthly budget</p>
              <button
                type="button"
                className="plan-edit"
                onClick={() => setEditing(true)}
              >
                Edit budget
              </button>
            </div>
            {editing ? (
              <input
                ref={amountRef}
                className="plan-amount-input"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                aria-label="Budget amount"
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            ) : (
              <p className="plan-amount">{hasBudget && data ? formatMoney(data.budgetAmount) : "Not set"}</p>
            )}
            <label className="plan-month">
              {monthTitle(month)}
              <input type="month" value={month} aria-label="Month" onChange={(event) => setMonth(event.target.value)} />
            </label>
            <div className="plan-track" role="img" aria-label={hasBudget ? `${Math.round(used)}% of this month's budget is used` : "No budget set"}>
              <i style={{ width: `${fill}%` }} />
            </div>
            <div className="plan-meta">
              <span>{formatMoney(data?.totalSpent ?? 0)} spent</span>
              <span className="plan-gold">{hasBudget ? `${Math.round(used)}% used` : "No budget"}</span>
            </div>
            {hasBudget && data && !over && (
              <p className="plan-remain">{formatMoney(data.remaining)} remaining this month</p>
            )}
            {over && data && (
              <p className="plan-over">Over by {formatMoney(Math.abs(data.remaining!))} this month</p>
            )}
            {!hasBudget && <p className="plan-remain muted-remain">Set a budget to see what's left.</p>}
          </article>

          <article className="plan-card">
            <p className="plan-kicker">A gentle check-in</p>
            <h2>{note?.title ?? "You're on track."}</h2>
            <p className="plan-copy">{note?.line ?? "Your budget will appear here."}</p>
            <p className="plan-gold plan-note">Small, consistent choices add up.</p>
          </article>
        </div>

        <article className="plan-card plan-alloc">
          <p className="plan-kicker">Category allocation</p>
          <h2>Give every dollar a direction.</h2>
          <div className="plan-cats">
            {categories.length === 0 && <p className="plan-copy">No spending in this month yet.</p>}
            {categories.map((row) => {
              const share = spentTotal > 0 ? Math.round((row.total / spentTotal) * 100) : 0;
              return (
                <div className="plan-cat" key={row.categoryId}>
                  <div className="plan-cat-top">
                    <span>{row.name}</span>
                    <span>{share}%</span>
                    <strong>{formatMoney(row.total)}</strong>
                  </div>
                  <div className="plan-track">
                    <i style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="plan-update" type="submit" disabled={saving}>{saving ? "Saving…" : "Update budget"}</button>
        </article>
      </form>

      {error && <p className="error">{error}</p>}
      <p className="plan-foot">Budget status updates automatically as expenses are added.</p>
    </section>
  );
}
