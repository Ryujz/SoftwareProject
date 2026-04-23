const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createAuditLog = require("../utils/auditLogger");
require("dotenv").config();

// Register
router.post("/register", async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role?.trim();

    const allowedRoles = ["vendor", "supplier", "admin"];

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        message: "username, email, password, and role are required"
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "role must be vendor, supplier, or admin"
      });
    }

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check email error:", checkErr.message);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message
        });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({
          message: "Email already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertSql =
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";

      db.query(
        insertSql,
        [username, email, hashedPassword, role],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Register error:", insertErr.message);
            return res.status(500).json({
              message: "Failed to register user",
              error: insertErr.message
            });
          }

          createAuditLog({
            user_id: result.insertId,
            action: "register",
            entity_type: "user",
            entity_id: result.insertId,
            details: `New ${role} account registered with email ${email}`
          });

          res.status(201).json({
            message: "User registered successfully",
            userId: result.insertId
          });
        }
      );
    });
  } catch (error) {
    console.error("Register catch error:", error.message);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// Login
router.post("/login", (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required"
      });
    }

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error("Login error:", err.message);
        return res.status(500).json({
          message: "Login failed",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password"
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      createAuditLog({
        user_id: user.id,
        action: "login",
        entity_type: "user",
        entity_id: user.id,
        details: `User ${user.email} logged in`
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error("Login catch error:", error.message);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;