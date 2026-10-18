import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteExpense, getCategories, getExpense, updateExpense } from "../api/client";
import { ExpenseForm } from "../components/ExpenseForm";
import type { Category, Expense } from "../types";
import { formatDate, formatMoney } from "../utils/format";

export function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExpense(id).then(setExpense).catch((err: Error) => setError(err.message));
    getCategories().then(setCategories).catch((err: Error) => setError(err.message));
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    try {
      await deleteExpense(id);
      navigate("/expenses");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the expense");
    }
  }

  return (
    <section className="stack">
      <div>
        <p><Link to="/expenses">Back to expenses</Link></p>
        <h1>Expense details</h1>
      </div>
      {error && <p className="error">{error}</p>}
      {expense && (
        <article className="card detail-sheet">
          <h2>{expense.title}</h2>
          <p className="money-accent">{formatMoney(expense.amount)}</p>
          <p>{expense.category?.name} · {expense.paymentMethod} · {formatDate(expense.date)}</p>
          <p>{expense.notes || "No notes"}</p>
          {confirming ? (
            <p className="confirm-line">
              Delete {expense.title}?
              <button type="button" className="text-link danger-link" onClick={handleDelete}>Yes, delete</button>
              <button type="button" className="text-link" onClick={() => setConfirming(false)}>Keep it</button>
            </p>
          ) : (
            <button type="button" className="text-link danger-link" onClick={() => setConfirming(true)}>Delete</button>
          )}
        </article>
      )}
      {expense && categories.length > 0 && (
        <div className="detail-edit">
          <h2>Update expense</h2>
          <ExpenseForm
            key={`${expense._id}-${expense.amount}-${expense.title}-${expense.date}`}
            categories={categories}
            initial={expense}
            submitLabel="Save changes"
            onSubmit={async (payload) => {
              await updateExpense(expense._id, payload);
              navigate("/expenses");
            }}
          />
        </div>
      )}
    </section>
  );
}