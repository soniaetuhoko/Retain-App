import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ExpenseFilters } from "../types";

const initialState: ExpenseFilters = {
  search: "",
  category: "",
  paymentMethod: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  sortBy: "date",
  sortOrder: "desc",
  page: 1,
  limit: 10,
};

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<{ key: keyof ExpenseFilters; value: string }>) {
      const { key, value } = action.payload;
      if (key === "page") state.page = Math.max(1, Number(value) || 1);
      else if (key === "limit") state.limit = Math.max(1, Number(value) || 1);
      else if (key === "sortBy") state.sortBy = value === "amount" ? "amount" : "date";
      else if (key === "sortOrder") state.sortOrder = value === "asc" ? "asc" : "desc";
      else if (key === "search") state.search = value;
      else if (key === "category") state.category = value;
      else if (key === "paymentMethod") state.paymentMethod = value;
      else if (key === "dateFrom") state.dateFrom = value;
      else if (key === "dateTo") state.dateTo = value;
      else if (key === "minAmount") state.minAmount = value;
      else if (key === "maxAmount") state.maxAmount = value;
      if (key !== "page") state.page = 1;
    },
    applyFilters(
      state,
      action: PayloadAction<Partial<Pick<ExpenseFilters, "search" | "category" | "paymentMethod" | "dateFrom" | "dateTo">>>,
    ) {
      const next = action.payload;
      if (next.search !== undefined) state.search = next.search;
      if (next.category !== undefined) state.category = next.category;
      if (next.paymentMethod !== undefined) state.paymentMethod = next.paymentMethod;
      if (next.dateFrom !== undefined) state.dateFrom = next.dateFrom;
      if (next.dateTo !== undefined) state.dateTo = next.dateTo;
      state.page = 1;
    },
    resetFilters() {
      return { ...initialState };
    },
  },
});

export const { setFilter, applyFilters, resetFilters } = filterSlice.actions;
export default filterSlice.reducer;