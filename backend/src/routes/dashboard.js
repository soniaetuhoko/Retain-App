const express = require("express");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const { requireAuth } = require("../middleware/auth");
const { parseMonth, currentMonth } = require("../utils/month");
const { money, describeBudget } = require("../utils/budgetStatus");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const parsed = parseMonth(req.query.month) || currentMonth();
    const expenses = await Expense.find({
      user: req.user._id,
      date: { $gte: parsed.start, $lt: parsed.end },
    })
      .populate("category", "name")
      .sort({ date: -1 });

    const rawSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const budget = await Budget.findOne({ user: req.user._id, month: parsed.month });
    const summary = describeBudget(rawSpent, budget ? budget.amount : null);
    const previousStart = new Date(parsed.start);
    previousStart.setUTCMonth(previousStart.getUTCMonth() - 1);
    const previousKey = `${previousStart.getUTCFullYear()}-${String(previousStart.getUTCMonth() + 1).padStart(2, "0")}`;
    const previous = parseMonth(previousKey);
    const earlier = await Expense.find({
      user: req.user._id,
      date: { $gte: previous.start, $lt: previous.end },
    });
    const previousSpent = money(earlier.reduce((sum, item) => sum + item.amount, 0));

    const highest = expenses.reduce((best, item) => {
      if (!best || item.amount > best.amount) return item;
      return best;
    }, null);

    const byCategory = new Map();
    for (const item of expenses) {
      const categoryId = item.category ? item.category._id.toString() : "none";
      const name = item.category ? item.category.name : "Uncategorized";
      const current = byCategory.get(categoryId) || { categoryId, name, total: 0 };
      current.total += item.amount;
      byCategory.set(categoryId, current);
    }

    res.json({
      month: parsed.month,
      expenseCount: expenses.length,
      previousSpent,
      ...summary,
      highestExpense: highest
        ? {
            _id: highest._id,
            title: highest.title,
            amount: money(highest.amount),
            date: highest.date,
            categoryName: highest.category ? highest.category.name : "Uncategorized",
          }
        : null,
      spendingByCategory: Array.from(byCategory.values())
        .map((row) => ({ ...row, total: money(row.total) }))
        .sort((a, b) => b.total - a.total),
      recentExpenses: expenses.slice(0, 5).map((item) => ({
        _id: item._id,
        title: item.title,
        amount: money(item.amount),
        date: item.date,
        categoryName: item.category ? item.category.name : "Uncategorized",
        paymentMethod: item.paymentMethod,
      })),
    });
  } catch {
    res.status(500).json({ message: "Could not load the dashboard" });
  }
});

module.exports = router;