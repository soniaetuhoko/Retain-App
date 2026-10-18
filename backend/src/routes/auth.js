const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {requireAuth} = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

function signToken(user) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, email, and a password of at least 6 characters are required" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: "user" });
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }
    return res.status(500).json({ message: "Could not create the account" });
  }
});
router.post("/signin", async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch {
    return res.status(500).json({ message: "Could not sign in" });
  }
});
router.get("/me", requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});
module.exports = router;