const express = require("express");
const Category = require("../models/Category");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { isValidId } = require("../utils/ids");
const { currentMonth, parseMonth } = require("../utils/month");
const { money } = require("../utils/budgetStatus");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post("/categories", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });
    const category = await Category.create({ name, isDefault: false });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That category already exists" });
    res.status(500).json({ message: "Could not create the category" });
  }
});

router.put("/categories/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid category id" });
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Category name is required" });
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    category.name = name;
    await category.save();
    res.json(category);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That category already exists" });
    res.status(500).json({ message: "Could not update the category" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid category id" });
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category.isDefault) {
      return res.status(400).json({ message: "The default category cannot be deleted" });
    }
    const fallback = await Category.findOne({ isDefault: true });
    if (!fallback) {
      return res.status(500).json({ message: "Default category is missing. Run npm run seed." });
    }
    await Expense.updateMany({ category: category._id }, { category: fallback._id });
    await category.deleteOne();
    res.json({ message: "Category deleted. Its expenses were moved to Uncategorized." });
  } catch {
    res.status(500).json({ message: "Could not delete the category" });
  }
});

router.get("/insights", async (req, res) => {
  try {
    const [totalUsers, totalExpenses, valueAgg, categories, grouped, recentExpenseDocs, recentUserDocs] =
      await Promise.all([
        User.countDocuments(),
        Expense.countDocuments(),
        Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
        Category.find().sort({ name: 1 }).lean(),
        Expense.aggregate([
          { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Expense.find()
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("category", "name")
          .populate("user", "name email"),
        User.find().sort({ createdAt: -1 }).limit(8).select("name email role createdAt"),
      ]);

    const month = parseMonth(req.query.month) || currentMonth();
    const expensesThisMonth = await Expense.countDocuments({
      date: { $gte: month.start, $lt: month.end },
    });

    const stats = new Map(grouped.map((row) => [String(row._id), row]));
    const rows = categories.map((category) => {
      const found = stats.get(String(category._id));
      return {
        name: category.name,
        total: found ? money(found.total) : 0,
        count: found ? found.count : 0,
        isDefault: Boolean(category.isDefault),
      };
    });
    const byCountDesc = [...rows].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const byCountAsc = [...rows].sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));

    res.json({
      totalUsers,
      totalExpenses,
      totalValue: valueAgg[0] ? money(valueAgg[0].total) : 0,
      expensesThisMonth,
      month: month.month,
      spendingPerCategory: rows.map(({ name, total, count, isDefault }) => ({ name, total, count, isDefault })),
      topCategories: byCountDesc.slice(0, 5).map(({ name, count, isDefault }) => ({ name, count, isDefault })),
      bottomCategories: byCountAsc.slice(0, 5).map(({ name, count, isDefault }) => ({ name, count, isDefault })),
      recentExpenses: recentExpenseDocs.map((expense) => ({
        _id: expense._id,
        title: expense.title,
        amount: money(expense.amount),
        date: expense.date,
        categoryName: expense.category ? expense.category.name : "Uncategorized",
        ownerName: expense.user ? expense.user.name : "Unknown",
        ownerEmail: expense.user ? expense.user.email : "",
      })),
      recentUsers: recentUserDocs.map((user) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })),
    });
  } catch {
    res.status(500).json({ message: "Could not load admin insights" });
  }
});

module.exports = router;