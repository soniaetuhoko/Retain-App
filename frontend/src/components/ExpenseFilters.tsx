import { useEffect, useState } from "react";
import { PAYMENT_METHODS, type Category } from "../types";
import { applyFilters, resetFilters } from "../redux/filterSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";

export function ExpenseFilters({ categories, onAdd }: { categories: Category[]; onAdd: () => void }) {
  const filters = useAppSelector((state) => state.filters);
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState(filters.search);
  const [category, setCategory] = useState(filters.category);
  const [paymentMethod, setPaymentMethod] = useState(filters.paymentMethod);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);

  useEffect(() => {
    setQuery(filters.search);
    setCategory(filters.category);
    setPaymentMethod(filters.paymentMethod);
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
  }, [filters.search, filters.category, filters.paymentMethod, filters.dateFrom, filters.dateTo]);

  function apply() {
    dispatch(applyFilters({
      search: query.trim(),
      category,
      paymentMethod,
      dateFrom,
      dateTo,
    }));
  }

  return (
    <>
      <form
        className="spend-search-row"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <label className="spend-search">
          <span className="sr-only">Search title or notes</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or notes..."
          />
        </label>
        <button type="button" className="spend-add" onClick={onAdd}>+ Add expense</button>
      </form>

      <section className="spend-card">
        <div className="spend-card-head">
          <p className="spend-kicker">Narrow your results</p>
          <div className="spend-actions">
            <button type="button" onClick={apply}>Search filter</button>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("");
                setPaymentMethod("");
                setDateFrom("");
                setDateTo("");
                dispatch(resetFilters());
              }}
            >
              Reset filter
            </button>
          </div>
        </div>
        <div className="spend-fields">
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </label>
          <label>
            Payment method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </label>
          <label>
            From
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>
      </section>
    </>
  );
}
