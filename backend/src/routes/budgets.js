const express = require("express");
const Budget = require("../models/Budget");
const { requireAuth } = require("../middleware/auth");
const { parseMonth, currentMonth } = require("../utils/month");
const { money } = require("../utils/budgetStatus");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const parsed = parseMonth(req.query.month) || currentMonth();
    const budget = await Budget.findOne({ user: req.user._id, month: parsed.month });
    res.json({ month: parsed.month, amount: budget ? money(budget.amount) : null });
  } catch {
    res.status(500).json({ message: "Could not load the budget" });
  }
});

router.put("/", async (req, res) => {
  try {
    const parsed = parseMonth(req.body.month);
    if (!parsed) return res.status(400).json({ message: "Month must be YYYY-MM" });
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Amount must be 0 or more" });
    }
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month: parsed.month },
      { $set: { amount }, $setOnInsert: { user: req.user._id, month: parsed.month } },
      { new: true, upsert: true }
    );
    res.json({ month: budget.month, amount: money(budget.amount) });
  } catch {
    res.status(500).json({ message: "Could not save the budget" });
  }
});

module.exports = router;