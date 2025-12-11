/* ---- authController.js ---- */

import { pool } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

/* ============================================================
   SMTP Gmail Transporter
   ============================================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,  // Example: yourname@gmail.com
    pass: process.env.SMTP_PASS,  // Gmail App Password
  },
});

/* ============================================================
   REGISTER USER
   ============================================================ */
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  try {
    /* ---- Check if email exists ---- */
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    /* ---- Hash password ---- */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---- Generate email verify token ---- */
    const verifyToken = crypto.randomBytes(32).toString("hex");

    /* ---- Insert new user ---- */
    await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_verified, verify_token, created_at)
       VALUES ($1, $2, $3, $4, false, $5, NOW())`,
      [username, email, hashedPassword, "user", verifyToken]
    );

    /* ---- Build verification link ---- */
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verifyToken}`;

    /* ---- Send Email ---- */
    const mailOptions = {
      from: `MythForge <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your MythForge Account",
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
      message: "Registration successful! Please check your email to verify your account.",
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   LOGIN USER
   ============================================================ */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result.rows[0];

    /* ---- Check if user active ---- */
    if (!user.is_active) {
      return res.status(403).json({
        message: "Your account is inactive. Contact the administrator.",
      });
    }

    /* ---- Must verify email ---- */
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    /* ---- Check password ---- */
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    /* ---- Generate JWT ---- */
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

/* ============================================================
   VERIFY EMAIL
   ============================================================ */
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
      return res.status(400).json({ message: "Invalid or expired token" });

    res.json({
      message: `Email verified successfully: ${result.rows[0].email}`,
    });

  } catch (err) {
    console.error("❌ Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
