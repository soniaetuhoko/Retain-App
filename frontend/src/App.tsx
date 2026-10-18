import { Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminCategories } from "./pages/AdminCategories";
import { AdminInsights } from "./pages/AdminInsights";
import { BudgetPage } from "./pages/BudgetPage";
import { Dashboard } from "./pages/Dashboard";
import { ExpenseDetail } from "./pages/ExpenseDetail";
import { Expenses } from "./pages/Expenses";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Welcome } from "./pages/Welcome";

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/:id" element={<ExpenseDetail />} />
          <Route path="/budget" element={<BudgetPage />} />
        </Route>
      </Route>
      <Route element={<AdminRoute />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminInsights />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}