const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");
const sendRealtimeNotification = require("../utils/realtimeNotify");

// Get all users
router.get("/users", authMiddleware, roleMiddleware("admin"), (req, res) => {
  const sql = `
    SELECT id, username, email, role, is_verified, verified_at, created_at
    FROM users
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get users error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch users",
        error: err.message
      });
    }

    res.json({
      message: "Users fetched successfully",
      users: results
    });
  });
});

// Verify supplier
router.put("/suppliers/:id/verify", authMiddleware, roleMiddleware("admin"), (req, res) => {
  const supplierId = req.params.id;

  const checkSql = "SELECT * FROM users WHERE id = ? AND role = 'supplier'";

  db.query(checkSql, [supplierId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check supplier error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }

    const updateSql = `
      UPDATE users
      SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.query(updateSql, [supplierId], (updateErr) => {
      if (updateErr) {
        console.error("Verify supplier error:", updateErr.message);
        return res.status(500).json({
          message: "Failed to verify supplier",
          error: updateErr.message
        });
      }

      const notificationSql = `
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        notificationSql,
        [
            supplierId,
            "supplier_verified",
            "Supplier Verification Approved",
            "Your supplier account has been verified by admin.",
            supplierId
        ],
        (notificationErr, notificationResult) => {
            if (notificationErr) {
            console.error("Create notification error:", notificationErr.message);
            } else {
            sendRealtimeNotification(supplierId, {
                id: notificationResult.insertId,
                type: "supplier_verified",
                title: "Supplier Verification Approved",
                message: "Your supplier account has been verified by admin.",
                related_id: Number(supplierId),
                created_at: new Date().toISOString()
            });
            }

            createAuditLog({
            user_id: req.user.id,
            action: "verify_supplier",
            entity_type: "user",
            entity_id: supplierId,
            details: `Admin verified supplier ID ${supplierId}`
            });

            res.json({
            message: "Supplier verified successfully"
            });
        }
        );
    });
  });
});

// Dashboard summary
router.get("/dashboard-summary", authMiddleware, roleMiddleware("admin"), (req, res) => {
  const summary = {};

  db.query("SELECT COUNT(*) AS total_users FROM users", (err1, result1) => {
    if (err1) {
      return res.status(500).json({ message: "Failed to fetch total users", error: err1.message });
    }
    summary.total_users = result1[0].total_users;

    db.query("SELECT COUNT(*) AS total_vendors FROM users WHERE role = 'vendor'", (err2, result2) => {
      if (err2) {
        return res.status(500).json({ message: "Failed to fetch total vendors", error: err2.message });
      }
      summary.total_vendors = result2[0].total_vendors;

      db.query("SELECT COUNT(*) AS total_suppliers FROM users WHERE role = 'supplier'", (err3, result3) => {
        if (err3) {
          return res.status(500).json({ message: "Failed to fetch total suppliers", error: err3.message });
        }
        summary.total_suppliers = result3[0].total_suppliers;

        db.query("SELECT COUNT(*) AS verified_suppliers FROM users WHERE role = 'supplier' AND is_verified = TRUE", (err4, result4) => {
          if (err4) {
            return res.status(500).json({ message: "Failed to fetch verified suppliers", error: err4.message });
          }
          summary.verified_suppliers = result4[0].verified_suppliers;

          db.query("SELECT COUNT(*) AS total_projects FROM projects", (err5, result5) => {
            if (err5) {
              return res.status(500).json({ message: "Failed to fetch total projects", error: err5.message });
            }
            summary.total_projects = result5[0].total_projects;

            db.query("SELECT COUNT(*) AS total_reviews FROM reviews", (err6, result6) => {
              if (err6) {
                return res.status(500).json({ message: "Failed to fetch total reviews", error: err6.message });
              }
              summary.total_reviews = result6[0].total_reviews;

              res.json({
                message: "Dashboard summary fetched successfully",
                summary
              });
            });
          });
        });
      });
    });
  });
});

// Get audit logs (admin only)
router.get("/audit-logs", authMiddleware, roleMiddleware("admin"), (req, res) => {
  const { action, user_id } = req.query;

  let sql = `
    SELECT audit_logs.*, users.username, users.email
    FROM audit_logs
    LEFT JOIN users ON audit_logs.user_id = users.id
    WHERE 1=1
  `;

  const params = [];

  if (action) {
    sql += " AND audit_logs.action = ? ";
    params.push(action);
  }

  if (user_id) {
    sql += " AND audit_logs.user_id = ? ";
    params.push(user_id);
  }

  sql += " ORDER BY audit_logs.created_at DESC ";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get audit logs error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch audit logs",
        error: err.message
      });
    }

    res.json({
      message: "Audit logs fetched successfully",
      logs: results
    });
  });
});

module.exports = router;