import { useState, type FormEvent } from "react";
import type { Category, Expense, ExpensePayload, PaymentMethod } from "../types";
import { PAYMENT_METHODS } from "../types";
import { toDateInput } from "../utils/format";

interface ExpenseFormProps {
  categories: Category[];
  initial?: Expense | null;
  submitLabel: string;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
}

export function ExpenseForm({ categories, initial, submitLabel, onSubmit }: ExpenseFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category._id ?? categories[0]?._id ?? "");
  const [date, setDate] = useState(initial ? toDateInput(initial.date) : new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? "Cash");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ title, amount: Number(amount), category, date, paymentMethod, notes });
      if (!initial) {
        setTitle("");
        setAmount("");
        setNotes("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entry" onSubmit={handleSubmit}>
      <div className="entry-lead">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Amount
          <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
      </div>
      <div className="entry-meta">
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} required>
            {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
      </div>
      <div className="pay-picks" role="radiogroup" aria-label="Payment method">
        {PAYMENT_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            className={paymentMethod === method ? "pay-pick on" : "pay-pick"}
            onClick={() => setPaymentMethod(method)}
          >
            {method}
          </button>
        ))}
      </div>
      <label className="entry-notes">
        Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="entry-submit">
        <button type="submit" disabled={saving}>{saving ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}