const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const createAuditLog = require("../utils/auditLogger");

// Create or get private chat with another user
router.post("/private/start", authMiddleware, (req, res) => {
  const currentUserId = req.user.id;
  const { other_user_id } = req.body;

  if (!other_user_id) {
    return res.status(400).json({
      message: "other_user_id is required"
    });
  }

  if (Number(other_user_id) === Number(currentUserId)) {
    return res.status(400).json({
      message: "You cannot start a chat with yourself"
    });
  }

  const user1 = Math.min(currentUserId, Number(other_user_id));
  const user2 = Math.max(currentUserId, Number(other_user_id));

  const checkUserSql = "SELECT id FROM users WHERE id = ?";

  db.query(checkUserSql, [other_user_id], (userErr, userResults) => {
    if (userErr) {
      console.error("Check other user error:", userErr.message);
      return res.status(500).json({
        message: "Database error",
        error: userErr.message
      });
    }

    if (userResults.length === 0) {
      return res.status(404).json({
        message: "Other user not found"
      });
    }

    const checkChatSql = `
      SELECT * FROM private_chats
      WHERE user1_id = ? AND user2_id = ?
    `;

    db.query(checkChatSql, [user1, user2], (chatErr, chatResults) => {
      if (chatErr) {
        console.error("Check chat error:", chatErr.message);
        return res.status(500).json({
          message: "Database error",
          error: chatErr.message
        });
      }

      if (chatResults.length > 0) {
        return res.json({
          message: "Chat already exists",
          chat: chatResults[0]
        });
      }

      const insertSql = `
        INSERT INTO private_chats (user1_id, user2_id)
        VALUES (?, ?)
      `;

      db.query(insertSql, [user1, user2], (insertErr, result) => {
        if (insertErr) {
          console.error("Create chat error:", insertErr.message);
          return res.status(500).json({
            message: "Failed to create chat",
            error: insertErr.message
          });
        }

        createAuditLog({
          user_id: currentUserId,
          action: "start_private_chat",
          entity_type: "private_chat",
          entity_id: result.insertId,
          details: `User started private chat with user ID ${other_user_id}`
        });

        res.status(201).json({
          message: "Private chat created successfully",
          chatId: result.insertId
        });
      });
    });
  });
});

// Get my private chats
router.get("/private", authMiddleware, (req, res) => {
  const currentUserId = req.user.id;

  const sql = `
    SELECT 
      private_chats.id,
      private_chats.user1_id,
      private_chats.user2_id,
      private_chats.created_at,
      CASE
        WHEN private_chats.user1_id = ? THEN u2.username
        ELSE u1.username
      END AS other_username,
      CASE
        WHEN private_chats.user1_id = ? THEN u2.email
        ELSE u1.email
      END AS other_email,
      CASE
        WHEN private_chats.user1_id = ? THEN u2.id
        ELSE u1.id
      END AS other_user_id
    FROM private_chats
    JOIN users u1 ON private_chats.user1_id = u1.id
    JOIN users u2 ON private_chats.user2_id = u2.id
    WHERE private_chats.user1_id = ? OR private_chats.user2_id = ?
    ORDER BY private_chats.created_at DESC
  `;

  db.query(sql, [currentUserId, currentUserId, currentUserId, currentUserId, currentUserId], (err, results) => {
    if (err) {
      console.error("Get private chats error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch chats",
        error: err.message
      });
    }

    res.json({
      message: "Private chats fetched successfully",
      chats: results
    });
  });
});

// Send message in private chat
router.post("/private/:chatId/message", authMiddleware, (req, res) => {
  const currentUserId = req.user.id;
  const { chatId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      message: "Message is required"
    });
  }

  const checkChatSql = `
    SELECT * FROM private_chats
    WHERE id = ? AND (user1_id = ? OR user2_id = ?)
  `;

  db.query(checkChatSql, [chatId, currentUserId, currentUserId], (chatErr, chatResults) => {
    if (chatErr) {
      console.error("Check chat access error:", chatErr.message);
      return res.status(500).json({
        message: "Database error",
        error: chatErr.message
      });
    }

    if (chatResults.length === 0) {
      return res.status(403).json({
        message: "You do not have access to this chat"
      });
    }

    const insertSql = `
      INSERT INTO private_messages (chat_id, sender_id, message)
      VALUES (?, ?, ?)
    `;

    db.query(insertSql, [chatId, currentUserId, message], (insertErr, result) => {
      if (insertErr) {
        console.error("Send message error:", insertErr.message);
        return res.status(500).json({
          message: "Failed to send message",
          error: insertErr.message
        });
      }

      createAuditLog({
        user_id: currentUserId,
        action: "send_private_message",
        entity_type: "private_message",
        entity_id: result.insertId,
        details: `User sent private message in chat ID ${chatId}`
      });

      res.status(201).json({
        message: "Message sent successfully",
        messageId: result.insertId
      });
    });
  });
});

// Get messages in a private chat
router.get("/private/:chatId/messages", authMiddleware, (req, res) => {
  const currentUserId = req.user.id;
  const { chatId } = req.params;

  const checkChatSql = `
    SELECT * FROM private_chats
    WHERE id = ? AND (user1_id = ? OR user2_id = ?)
  `;

  db.query(checkChatSql, [chatId, currentUserId, currentUserId], (chatErr, chatResults) => {
    if (chatErr) {
      console.error("Check chat access error:", chatErr.message);
      return res.status(500).json({
        message: "Database error",
        error: chatErr.message
      });
    }

    if (chatResults.length === 0) {
      return res.status(403).json({
        message: "You do not have access to this chat"
      });
    }

    const sql = `
      SELECT 
        private_messages.id,
        private_messages.chat_id,
        private_messages.sender_id,
        private_messages.message,
        private_messages.created_at,
        users.username AS sender_username,
        users.email AS sender_email
      FROM private_messages
      JOIN users ON private_messages.sender_id = users.id
      WHERE private_messages.chat_id = ?
      ORDER BY private_messages.created_at ASC
    `;

    db.query(sql, [chatId], (err, results) => {
      if (err) {
        console.error("Get messages error:", err.message);
        return res.status(500).json({
          message: "Failed to fetch messages",
          error: err.message
        });
      }

      res.json({
        message: "Messages fetched successfully",
        messages: results
      });
    });
  });
});

module.exports = router;