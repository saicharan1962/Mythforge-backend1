/* ----authContoller.js---- */

import { pool } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

/* ----------------------- SMTP Gmail Setup ----------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,   // your @my.liu.edu email
    pass: process.env.SMTP_PASS,   // Gmail App Password
  },
});

/* -------------------------- REGISTER USER ----------------------------- */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    // Check if email already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    // Password hashing
    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    // Insert new user — NOTE: is_active defaults to TRUE in DB
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified, verify_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [username, email, hashed, "user", false, verifyToken]
    );

    // Email verification link
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;

    /* ------------------- Send Verification Email (SMTP Gmail) ------------------- */
    const mailOptions = {
      from: `MythForge <${process.env.SMTP_USER}>`,
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

          <p style="margin-top:30px; font-size:12px; opacity:0.8;">If the button does not work, click this link:</p>
          <p>${verifyLink}</p>

          <br/>
          <small>This link expires in 24 hours.</small>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

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

    /* ---------------------- NEW INACTIVE CHECK ---------------------- */
    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator.",
      });
    }

    /* ---------------------- Email must be verified ------------------ */
    if (!user.is_verified)
      return res.status(403).json({ message: "Please verify your email before logging in." });

    /* ---------------------- Password check -------------------------- */
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: "Invalid credentials" });

    /* ---------------------- JWT token ------------------------------- */
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
