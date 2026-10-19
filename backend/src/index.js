const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDb = require("./config/db");

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
      if (process.env.NODE_ENV === "production" || !origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "error",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/admin", require("./routes/admin"));

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found" });
});

if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(dist));
  app.use((req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
