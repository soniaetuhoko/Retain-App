import { useEffect, useState, type FormEvent } from "react";
import { createCategory, deleteCategory, getAdminInsights, getCategories, updateCategory } from "../api/client";
import type { AdminInsights, Category } from "../types";

const notes: Record<string, string> = {
  Food: "Meals, snacks and groceries",
  Transport: "Buses, taxis and travel costs",
  Bills: "Rent, power and regular bills",
  Shopping: "Clothes and everyday items",
  Health: "Medicine and wellness costs",
  Uncategorized: "Used when another category is removed",
};

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingDelete, setPendingDelete] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function applyCategories(items: Category[]) {
    setCategories(items);
  }

  async function reload() {
    const [items, report] = await Promise.all([getCategories(), getAdminInsights()]);
    applyCategories(items);
    setInsights(report);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await createCategory(name);
      setName("");
      setAdding(false);
      await reload();
      setMessage("Category created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the category");
    }
  }

  async function handleRename(id: string) {
    setError("");
    setMessage("");
    try {
      await updateCategory(id, draft);
      setEditing("");
      await reload();
      setMessage("Category updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the category");
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setMessage("");
    try {
      const result = await deleteCategory(id);
      setPendingDelete("");
      await reload();
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the category");
    }
  }

  const counts = new Map((insights?.spendingPerCategory ?? []).map((row) => [row.name, row.count]));
  const activeCount = categories.filter((item) => !item.isDefault).length;
  const fallback = categories.find((item) => item.isDefault);

  return (
    <section className="admin">
      <header className="admin-intro">
        <div>
          <p className="admin-kicker">Platform control</p>
          <h1>Expense categories</h1>
          <p className="admin-line">Create and maintain the categories users rely on to organise spending.</p>
        </div>
        <button type="button" className="admin-pill" onClick={() => setAdding((open) => !open)}>+ Add category</button>
      </header>

      <article className="admin-card">
        <div className="admin-card-head">
          <div>
            <p className="admin-kicker">Category library</p>
            <p className="admin-sub">Keep categories clear and useful. Categories linked to existing expenses need a reassignment before deletion.</p>
          </div>
          <div className="admin-chips">
            <span>{activeCount} active {activeCount === 1 ? "category" : "categories"}</span>
            <span>1 default category: {fallback?.name ?? "Uncategorized"}</span>
          </div>
        </div>

        {adding && (
          <form className="admin-add" onSubmit={handleCreate}>
            <label>
              Category name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <button type="submit">Save category</button>
          </form>
        )}

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <div className="cat-table">
          <div className="cat-row cat-head">
            <span>Category</span>
            <span>Description</span>
            <span>Expenses</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {categories.map((category) => (
            <div className="cat-row" key={category._id}>
              <div className="cat-name" data-label="Category">
                {editing === category._id ? (
                  <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Category name" />
                ) : (
                  <strong>{category.name}</strong>
                )}
              </div>
              <span className="cat-note" data-label="Description">{notes[category.name] ?? "—"}</span>
              <span data-label="Expenses">{(counts.get(category.name) ?? 0).toLocaleString("en-US")}</span>
              {category.isDefault ? (
                <span className="cat-status" data-label="Status"><em className="tag tag-default">Default</em><em className="tag tag-lock">Protected</em></span>
              ) : (
                <em className="tag tag-active" data-label="Status">Active</em>
              )}
              <div className="cat-actions" data-label="Actions">
                {pendingDelete === category._id ? (
                  <>
                    <button type="button" className="text-link danger-link" onClick={() => handleDelete(category._id)}>Yes, delete</button>
                    <button type="button" className="text-link" onClick={() => setPendingDelete("")}>Keep</button>
                  </>
                ) : editing === category._id ? (
                  <>
                    <button type="button" className="text-link" onClick={() => handleRename(category._id)}>Save</button>
                    <button type="button" className="text-link" onClick={() => setEditing("")}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setEditing(category._id);
                        setDraft(category.name);
                        setPendingDelete("");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-link danger-link"
                      disabled={category.isDefault}
                      onClick={() => setPendingDelete(category._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      <p className="admin-foot">
        Deletion safety. If a category has linked expenses, reassignment to Uncategorized happens before removing it. The default category cannot be deleted.
      </p>
    </section>
  );
}
