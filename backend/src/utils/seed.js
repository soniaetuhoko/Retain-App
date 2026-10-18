require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDb = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");

async function seed() {
  await connectDb();

  const email = String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Retain Admin";
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const hashed = await bcrypt.hash(password, 10);
  let admin = await User.findOne({ email });
  if (!admin) admin = await User.findOne({ role: "admin" });
  if (!admin) {
    await User.create({ name, email, password: hashed, role: "admin" });
    console.log("Admin created");
  } else {
    admin.name = name;
    admin.email = email;
    admin.password = hashed;
    admin.role = "admin";
    await admin.save();
    console.log("Admin login updated");
  }

  const defaults = ["Uncategorized", "Food", "Transport", "Bills", "Shopping", "Health"];
  for (const categoryName of defaults) {
    const found = await Category.findOne({ name: categoryName });
    if (!found) {
      await Category.create({
        name: categoryName,
        isDefault: categoryName === "Uncategorized",
      });
      console.log("Category created:", categoryName);
    }
  }

  const fallback = await Category.findOne({ name: "Uncategorized" });
  if (fallback && !fallback.isDefault) {
    fallback.isDefault = true;
    await fallback.save();
  }

  console.log("Seed finished");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});