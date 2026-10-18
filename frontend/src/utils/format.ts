import type { BudgetStatus } from "../types";

export function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "Not set";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function statusLabel(status: BudgetStatus): string {
  if (status === "within") return "Within budget";
  if (status === "approaching") return "Approaching budget";
  if (status === "over") return "Over budget";
  return "No budget set";
}

export function toDateInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}