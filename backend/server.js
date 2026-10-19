require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./src/config/db");

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/expenses", require("./src/routes/expenses"));
app.use("/api/budgets", require("./src/routes/budgets"));
app.use("/api/categories", require("./src/routes/categories"));
app.use("/api/dashboard", require("./src/routes/dashboard"));
app.use("/api/admin", require("./src/routes/admin"));
const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });