const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");

// Get my notifications
router.get("/", authMiddleware, (req, res) => {
  const sql = `
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Get notifications error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch notifications",
        error: err.message
      });
    }

    res.json({
      message: "Notifications fetched successfully",
      notifications: results
    });
  });
});

// Mark one notification as read
router.put("/:id/read", authMiddleware, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  const sql = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      console.error("Mark notification as read error:", err.message);
      return res.status(500).json({
        message: "Failed to update notification",
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      message: "Notification marked as read"
    });
  });
});

// Mark all notifications as read
router.put("/read/all", authMiddleware, (req, res) => {
  const sql = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = ? AND is_read = FALSE
  `;

  db.query(sql, [req.user.id], (err) => {
    if (err) {
      console.error("Mark all notifications as read error:", err.message);
      return res.status(500).json({
        message: "Failed to update notifications",
        error: err.message
      });
    }

    res.json({
      message: "All notifications marked as read"
    });
  });
});

module.exports = router;