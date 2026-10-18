import type {
  AdminInsights,
  AuthResponse,
  Budget,
  Category,
  DashboardData,
  Expense,
  ExpenseFilters,
  ExpensePayload,
  PagedExpenses,
  User,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL;
export const TOKEN_KEY = "retain_token";

if (!API_URL) {
  throw new Error("VITE_API_URL is missing");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the API. Start the backend with npm run dev.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data.message === "string" ? data.message : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export function signUp(payload: { name: string; email: string; password: string }) {
  return request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(payload) });
}

export function signIn(payload: { email: string; password: string }) {
  return request<AuthResponse>("/auth/signin", { method: "POST", body: JSON.stringify(payload) });
}

export function getMe() {
  return request<User>("/auth/me");
}

export function getExpenses(filters: ExpenseFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") params.set(key, String(value));
  });
  return request<PagedExpenses>(`/expenses?${params.toString()}`);
}

export function getExpense(id: string) {
  return request<Expense>(`/expenses/${id}`);
}

export function createExpense(payload: ExpensePayload) {
  return request<Expense>("/expenses", { method: "POST", body: JSON.stringify(payload) });
}

export function updateExpense(id: string, payload: ExpensePayload) {
  return request<Expense>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteExpense(id: string) {
  return request<{ message: string }>(`/expenses/${id}`, { method: "DELETE" });
}

export function getBudget(month: string) {
  return request<Budget>(`/budgets?month=${month}`);
}

export function saveBudget(payload: { month: string; amount: number }) {
  return request<Budget>("/budgets", { method: "PUT", body: JSON.stringify(payload) });
}

export function getCategories() {
  return request<Category[]>("/categories");
}

export function getDashboard(month: string) {
  return request<DashboardData>(`/dashboard?month=${month}`);
}

export function getAdminInsights(month?: string) {
  const query = month ? `?month=${month}` : "";
  return request<AdminInsights>(`/admin/insights${query}`);
}

export function createCategory(name: string) {
  return request<Category>("/admin/categories", { method: "POST", body: JSON.stringify({ name }) });
}

export function updateCategory(id: string, name: string) {
  return request<Category>(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
}

export function deleteCategory(id: string) {
  return request<{ message: string }>(`/admin/categories/${id}`, { method: "DELETE" });
}