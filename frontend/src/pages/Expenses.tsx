import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense, deleteExpense, getCategories, getExpenses } from "../api/client";
import { ExpenseFilters } from "../components/ExpenseFilters";
import { ExpenseForm } from "../components/ExpenseForm";
import { setFilter } from "../redux/filterSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import type { Category, PagedExpenses } from "../types";
import { formatMoney } from "../utils/format";

function listDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Expenses() {
  const filters = useAppSelector((state) => state.filters);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<PagedExpenses | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError("");
    getExpenses(filters)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, refreshKey]);

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id);
      setPendingDelete("");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the expense");
    }
  }

  const total = data?.total ?? 0;
  const start = data && total > 0 ? (data.page - 1) * data.limit + 1 : 0;
  const end = data ? Math.min(data.page * data.limit, total) : 0;
  const pages = data?.pages ?? 1;
  const page = data?.page ?? 1;

  return (
    <section className="spend">
      <header className="spend-intro">
        <p className="spend-kicker">Your spending</p>
        <h1>Look through your spending.</h1>
        <p className="spend-line">Search, filter, and keep track of your expenses.</p>
      </header>

      <ExpenseFilters categories={categories} onAdd={() => setAdding(true)} />

      {adding && (
        <div className="spend-card spend-entry">
          <div className="spend-card-head">
            <p className="spend-kicker">Add an expense</p>
            <button type="button" className="spend-quiet" onClick={() => setAdding(false)}>Close</button>
          </div>
          {categories.length > 0 ? (
            <ExpenseForm
              categories={categories}
              submitLabel="Add expense"
              onSubmit={async (payload) => {
                await createExpense(payload);
                setAdding(false);
                setRefreshKey((value) => value + 1);
              }}
            />
          ) : (
            <p className="spend-line">Categories are still loading.</p>
          )}
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <div className="spend-card spend-table">
        <div className="spend-card-head">
          <p className="spend-kicker">All expenses</p>
          <span className="spend-count">{total} {total === 1 ? "record" : "records"}</span>
        </div>
        <div className="spend-cols spend-head">
          <span>Date</span>
          <span>Expense</span>
          <span>Category</span>
          <span>Payment</span>
          <span>Amount</span>
          <span>Actions</span>
        </div>
        {data && data.items.length === 0 && <p className="spend-empty">No expenses match these filters.</p>}
        {data?.items.map((expense, index) => (
          <article className={index % 2 === 1 ? "spend-cols spend-row alt" : "spend-cols spend-row"} key={expense._id}>
            <span data-label="Date">{listDate(expense.date)}</span>
            <strong data-label="Expense">
              {expense.title}
              {expense.notes ? <span className="spend-note"> · {expense.notes}</span> : null}
            </strong>
            <span data-label="Category">{expense.category?.name}</span>
            <span data-label="Payment">{expense.paymentMethod}</span>
            <span className="spend-amount" data-label="Amount">{formatMoney(expense.amount)}</span>
            <div className="spend-links" data-label="Actions">
              {pendingDelete === expense._id ? (
                <>
                  <span>Delete?</span>
                  <button type="button" className="spend-link danger" onClick={() => handleDelete(expense._id)}>Yes</button>
                  <button type="button" className="spend-link" onClick={() => setPendingDelete("")}>Keep</button>
                </>
              ) : (
                <>
                  <button type="button" className="spend-link" onClick={() => navigate(`/expenses/${expense._id}`)}>View</button>
                  <button type="button" className="spend-link edit" onClick={() => navigate(`/expenses/${expense._id}`)}>Edit</button>
                  <button type="button" className="spend-link danger" onClick={() => setPendingDelete(expense._id)}>Delete</button>
                </>
              )}
            </div>
          </article>
        ))}
        <div className="spend-foot">
          <span>{total === 0 ? "Showing 0 expenses" : `Showing ${start}-${end} of ${total} expenses`}</span>
          <div className="spend-pages">
            <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => dispatch(setFilter({ key: "page", value: String(page - 1) }))}>‹</button>
            <span>{page}</span>
            <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => dispatch(setFilter({ key: "page", value: String(page + 1) }))}>›</button>
          </div>
        </div>
      </div>
    </section>
  );
}
