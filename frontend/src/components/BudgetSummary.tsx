import type { DashboardData } from "../types";
import { formatMoney, statusLabel } from "../utils/format";

export function BudgetSummary({ data }: { data: DashboardData }) {
  const hasBudget = data.budgetAmount !== null && data.budgetAmount > 0;
  const over = data.remaining !== null && data.remaining < 0;
  const used = hasBudget ? (data.totalSpent / data.budgetAmount!) * 100 : 0;
  const fill = Math.min(used, 100);
  const usedText = !hasBudget
    ? "Set a budget to see how much of the month is used."
    : used > 0 && used < 1
      ? "Under 1% of this month's budget is used."
      : `${Math.round(used)}% of this month's budget is used.`;
  const highest = data.highestExpense;

  return (
    <section className="card budget-panel" data-status={data.status}>
      <p className="eyebrow">Monthly budget</p>
      <h2 className="budget-title">
        Total monthly budget:{" "}
        <span className="money-accent">{hasBudget ? formatMoney(data.budgetAmount) : "Not set"}</span>
      </h2>
      <p className="budget-line">
        Spent so far: {formatMoney(data.totalSpent)}
        {hasBudget && !over && (
          <>
            {" "}· Remaining: <span className="money-accent">{formatMoney(data.remaining)}</span>
          </>
        )}
        {over && (
          <>
            {" "}· Over by: <span className="money-over">{formatMoney(Math.abs(data.remaining!))}</span>
          </>
        )}
      </p>
      <div className="meter" role="img" aria-label={usedText}>
        <span style={{ width: `${fill}%` }} />
      </div>
      <p className="budget-used">{usedText}</p>
      <p className={`status-pill status-${data.status}`}>{statusLabel(data.status)}</p>
      <p className="budget-foot">
        {highest
          ? `Highest expense: ${highest.title}, ${formatMoney(highest.amount)}, ${highest.categoryName}.`
          : "No expenses recorded this month."}
      </p>
    </section>
  );
}
