function parseMonth(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month || ""))) {
    return null;
  }
  const [year, mon] = String(month).split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return { month: String(month), start, end };
}

function currentMonth() {
  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return parseMonth(month);
}

module.exports = { parseMonth, currentMonth };