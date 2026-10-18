const express = require("express");
const Expense = require("../models/Expense");
const Category = require("../models/Category");
const { requireAuth } = require("../middleware/auth");
const { isValidId } = require("../utils/ids");

const router = express.Router();
const METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Money"];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readExpenseInput(body) {
  const title = String(body.title || "").trim();
  const notes = String(body.notes || "").trim();
  const amount = Number(body.amount);
  const date = new Date(body.date);
  if (!title) return { error: "Title is required" };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Amount must be 0 or more" };
  if (!METHODS.includes(body.paymentMethod)) return { error: "Choose a valid payment method" };
  if (Number.isNaN(date.getTime())) return { error: "Choose a valid date" };
  if (!isValidId(body.category)) return { error: "Choose a valid category" };
  const category = await Category.findById(body.category);
  if (!category) return { error: "Choose a valid category" };
  return {
    value: {
      title,
      notes,
      amount,
      date,
      paymentMethod: body.paymentMethod,
      category: category._id,
    },
  };
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const filter = { user: req.user._id };
    const search = String(req.query.search || "").trim();
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { title: { $regex: safe, $options: "i" } },
        { notes: { $regex: safe, $options: "i" } },
      ];
    }
    if (req.query.category && isValidId(req.query.category)) {
      filter.category = String(req.query.category);
    }
    if (METHODS.includes(String(req.query.paymentMethod || ""))) {
      filter.paymentMethod = String(req.query.paymentMethod);
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) {
        const from = new Date(String(req.query.dateFrom));
        if (!Number.isNaN(from.getTime())) filter.date.$gte = from;
      }
      if (req.query.dateTo) {
        const to = new Date(String(req.query.dateTo));
        if (!Number.isNaN(to.getTime())) {
          to.setUTCHours(23, 59, 59, 999);
          filter.date.$lte = to;
        }
      }
      if (Object.keys(filter.date).length === 0) delete filter.date;
    }
    const amount = {};
    if (req.query.minAmount !== undefined && req.query.minAmount !== "") {
      const min = Number(req.query.minAmount);
      if (Number.isFinite(min)) amount.$gte = min;
    }
    if (req.query.maxAmount !== undefined && req.query.maxAmount !== "") {
      const max = Number(req.query.maxAmount);
      if (Number.isFinite(max)) amount.$lte = max;
    }
    if (Object.keys(amount).length > 0) filter.amount = amount;

    const sortBy = req.query.sortBy === "amount" ? "amount" : "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "10"), 10) || 10));

    const [items, total] = await Promise.all([
      Expense.find(filter)
        .populate("category", "name")
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch {
    res.status(500).json({ message: "Could not load expenses" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = await readExpenseInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const expense = await Expense.create({ ...parsed.value, user: req.user._id });
    await expense.populate("category", "name");
    res.status(201).json(expense);
  } catch {
    res.status(500).json({ message: "Could not create the expense" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate("category", "name");
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch {
    res.status(500).json({ message: "Could not load the expense" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    const parsed = await readExpenseInput(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    Object.assign(expense, parsed.value);
    await expense.save();
    await expense.populate("category", "name");
    res.json(expense);
  } catch {
    res.status(500).json({ message: "Could not update the expense" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid expense id" });
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch {
    res.status(500).json({ message: "Could not delete the expense" });
  }
});

module.exports = router;