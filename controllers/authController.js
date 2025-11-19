// controllers/authController.js
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

/* ----------------------- Email Transport Setup ----------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -------------------------- REGISTER USER ----------------------------- */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // ✅ Default role is "user"; admin accounts should be inserted manually
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified, verify_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING user_id, username, email, role, is_verified`,
      [username, email, hashed, "user", false, verifyToken]
    );

    const user = result.rows[0];

    // Send verification email
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;
    await transporter.sendMail({
      from: `"MythForge Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your MythForge account",
      html: `
        <h2>Welcome to MythForge, ${username}!</h2>
        <p>Click the link below to verify your account:</p>
        <a href="${verifyLink}" target="_blank">${verifyLink}</a>
        <br><br>
        <small>This link will expire in 24 hours.</small>
      `,
    });

    res.status(201).json({
      message: "Registration successful! Check your email to verify your account.",
      user,
    });
  } catch (err) {
    console.error("❌ Login error details:", err.message, err.stack);
  res.status(500).json({ message: "Server error during login", error: err.message });
  }
};

/* ---------------------------- LOGIN USER ------------------------------ */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = userRes.rows[0];

    // ✅ Check verification
    if (!user.is_verified)
      return res.status(403).json({ message: "Please verify your email before login." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Include role in token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------- VERIFY EMAIL TOKEN ---------------------------- */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const result = await pool.query(
      "UPDATE users SET is_verified = true, verify_token = NULL WHERE verify_token = $1 RETURNING username, email",
      [token]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    res.json({
      message: `✅ Email verified successfully for ${result.rows[0].email}`,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
