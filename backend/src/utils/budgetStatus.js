function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

function describeBudget(totalSpent, budgetAmount) {
  const spent = money(totalSpent);
  if (budgetAmount === null || budgetAmount === undefined) {
    return { totalSpent: spent, budgetAmount: null, remaining: null, status: "no-budget" };
  }
  const budget = money(budgetAmount);
  const remaining = money(budget - spent);
  let status = "within";
  if (spent > budget) status = "over";
  else if (budget > 0 && spent >= budget * 0.8) status = "approaching";
  return { totalSpent: spent, budgetAmount: budget, remaining, status };
}

module.exports = { money, describeBudget };