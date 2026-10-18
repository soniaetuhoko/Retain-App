export type UserRole = "user" | "admin";
export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Mobile Money";
export type SortBy = "date" | "amount";
export type SortOrder = "asc" | "desc";
export type BudgetStatus = "no-budget" | "within" | "approaching" | "over";

export const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "Card", "Bank Transfer", "Mobile Money"];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  isDefault: boolean;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string;
}

export interface ExpensePayload {
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

export interface ExpenseFilters {
  search: string;
  category: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  page: number;
  limit: number;
}

export interface PagedExpenses {
  items: Expense[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Budget {
  month: string;
  amount: number | null;
}

export interface DashboardExpense {
  _id: string;
  title: string;
  amount: number;
  date: string;
  categoryName: string;
  paymentMethod?: string;
}

export interface DashboardData {
  month: string;
  expenseCount: number;
  previousSpent: number;
  totalSpent: number;
  budgetAmount: number | null;
  remaining: number | null;
  status: BudgetStatus;
  highestExpense: DashboardExpense | null;
  spendingByCategory: { categoryId: string; name: string; total: number }[];
  recentExpenses: DashboardExpense[];
}

export interface AdminInsights {
  totalUsers: number;
  totalExpenses: number;
  totalValue: number;
  expensesThisMonth: number;
  month: string;
  spendingPerCategory: { name: string; total: number; count: number; isDefault: boolean }[];
  topCategories: { name: string; count: number; isDefault: boolean }[];
  bottomCategories: { name: string; count: number; isDefault: boolean }[];
  recentExpenses: {
    _id: string;
    title: string;
    amount: number;
    date: string;
    categoryName: string;
    ownerName: string;
    ownerEmail: string;
  }[];
  recentUsers: {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}