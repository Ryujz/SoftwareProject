const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const createAuditLog = require("../utils/auditLogger");

router.post("/verify/thaiid", async (req, res) => {
  try {
    const { code, user_type } = req.body;

    if (!code || !user_type) {
      return res.status(400).json({
        error: "code and user_type are required"
      });
    }

    if (!["vendor", "supplier"].includes(user_type)) {
      return res.status(400).json({
        error: "user_type must be vendor or supplier"
      });
    }

    // mock validation
    if (code !== "mock-thaiid-success") {
      return res.status(400).json({
        error: "Invalid or expired ThaiID code."
      });
    }

    const thaiIdHash = crypto
      .createHash("sha256")
      .update(`thaiid-${user_type}-${Date.now()}`)
      .digest("hex");

    const fullNameTh = user_type === "vendor" ? "สมชาย ตัวอย่าง" : "บริษัท ซัพพลายเออร์ ตัวอย่าง";
    const fullNameEn = user_type === "vendor" ? "Somchai Example" : "Example Supplier Co., Ltd.";

    const email = `${user_type}.${Date.now()}@thaiid.mock`;
    const username = `${user_type}_thaiid_${Date.now()}`;

    const defaultPassword = await bcrypt.hash("thaiid-mock-password", 10);

    const checkSql = "SELECT * FROM users WHERE thai_id_hash = ?";

    db.query(checkSql, [thaiIdHash], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("ThaiID check error:", checkErr.message);
        return res.status(500).json({
          error: "Database error"
        });
      }

      if (checkResults.length > 0) {
        return res.status(409).json({
          error: "User already exists."
        });
      }

      const insertSql = `
        INSERT INTO users (username, email, password, role, thai_id_hash, full_name_th, full_name_en)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [username, email, defaultPassword, user_type, thaiIdHash, fullNameTh, fullNameEn],
        (insertErr, result) => {
          if (insertErr) {
            console.error("ThaiID insert user error:", insertErr.message);
            return res.status(500).json({
              error: "Failed to create account"
            });
          }

          const userId = result.insertId;

          const token = jwt.sign(
            {
              id: userId,
              email,
              role: user_type
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          createAuditLog({
            user_id: userId,
            action: "thaiid_register",
            entity_type: "user",
            entity_id: userId,
            details: `New ${user_type} account registered via ThaiID mock flow`
          });

          return res.status(201).json({
            message: "Account created successfully.",
            user_profile: {
              user_id: userId,
              thai_id_hash: thaiIdHash,
              full_name_th: fullNameTh,
              full_name_en: fullNameEn,
              identity_details: {
                address: "123 Bangkok, Thailand",
                date_of_birth: "2000-01-01"
              },
              account_status: "active",
              role: user_type
            },
            access_token: token
          });
        }
      );
    });
  } catch (error) {
    console.error("ThaiID mock route error:", error.message);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;