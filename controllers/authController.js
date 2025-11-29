// controllers/authController.js


import { pool } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import { Resend } from "resend";

dotenv.config();

/* ----------------------- Resend Email Setup ----------------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

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

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified, verify_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING user_id, username, email`,
      [username, email, hashed, "user", false, verifyToken]
    );

    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;

    /* ------------------- Send Verification Email (Resend) ------------------- */
    await resend.emails.send({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Verify your MythForge account",
      html: `
        <div style="font-family: 'Cinzel', serif; background:#0e0a1a; padding:25px; color:#fff;">
          <h2 style="color:#ffd700;">Welcome to MythForge, ${username} ⚡</h2>
          <p>Click the button below to verify your email:</p>
          <a href="${verifyLink}" 
             style="display:inline-block; margin-top:20px; padding:12px 25px; background:#ffd700; color:#000; 
             font-weight:bold; border-radius:8px; text-decoration:none; font-size:16px;">
             Verify My Account
          </a>
          <p style="margin-top:30px; font-size:12px; opacity:0.8;">If the button doesn't work, copy this link:</p>
          <p style="font-size:12px; opacity:0.7;">${verifyLink}</p>
          <br>
          <small>This link expires in 24 hours.</small>
        </div>
      `
    });

    res.status(201).json({
      message: "Registration successful! Check your email to verify your account.",
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error" });
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

    // Block login until email is verified
    if (!user.is_verified)
      return res.status(403).json({ message: "Please verify your email before logging in." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

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
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------------- VERIFY EMAIL TOKEN ---------------------------- */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET is_verified = true, verify_token = NULL 
       WHERE verify_token = $1
       RETURNING email`,
      [token]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ message: "Invalid or expired verification link" });

    res.json({
      message: `Email verified successfully: ${result.rows[0].email}`,
    });

  } catch (err) {
    console.error("❌ Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
