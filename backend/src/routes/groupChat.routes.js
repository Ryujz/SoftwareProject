const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");

// Vendor creates a group chat for a project
router.post("/:projectId/create", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { projectId } = req.params;
  const { group_name } = req.body;
  const vendorId = req.user.id;

  if (!group_name) {
    return res.status(400).json({
      message: "group_name is required"
    });
  }

  const checkProjectSql = "SELECT * FROM projects WHERE id = ? AND vendor_id = ?";

  db.query(checkProjectSql, [projectId, vendorId], (projectErr, projectResults) => {
    if (projectErr) {
      console.error("Check project error:", projectErr.message);
      return res.status(500).json({
        message: "Database error",
        error: projectErr.message
      });
    }

    if (projectResults.length === 0) {
      return res.status(403).json({
        message: "You can only create group chat for your own project"
      });
    }

    const insertSql = `
      INSERT INTO group_chats (project_id, group_name, created_by)
      VALUES (?, ?, ?)
    `;

    db.query(insertSql, [projectId, group_name, vendorId], (insertErr, result) => {
      if (insertErr) {
        console.error("Create group chat error:", insertErr.message);
        return res.status(500).json({
          message: "Failed to create group chat",
          error: insertErr.message
        });
      }

      const groupChatId = result.insertId;

      // add vendor as first member
      const addMemberSql = `
        INSERT INTO group_chat_members (group_chat_id, user_id)
        VALUES (?, ?)
      `;

      db.query(addMemberSql, [groupChatId, vendorId], (memberErr) => {
        if (memberErr) {
          console.error("Add creator to group error:", memberErr.message);
        }

        createAuditLog({
          user_id: vendorId,
          action: "create_group_chat",
          entity_type: "group_chat",
          entity_id: groupChatId,
          details: `Vendor created group chat "${group_name}" for project ID ${projectId}`
        });

        res.status(201).json({
          message: "Group chat created successfully",
          groupChatId
        });
      });
    });
  });
});

// Vendor adds supplier/member to group
router.post("/:groupChatId/add-member", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { groupChatId } = req.params;
  const { user_id } = req.body;
  const vendorId = req.user.id;

  if (!user_id) {
    return res.status(400).json({
      message: "user_id is required"
    });
  }

  const checkGroupSql = `
    SELECT group_chats.*, projects.vendor_id
    FROM group_chats
    JOIN projects ON group_chats.project_id = projects.id
    WHERE group_chats.id = ? AND projects.vendor_id = ?
  `;

  db.query(checkGroupSql, [groupChatId, vendorId], (groupErr, groupResults) => {
    if (groupErr) {
      console.error("Check group ownership error:", groupErr.message);
      return res.status(500).json({
        message: "Database error",
        error: groupErr.message
      });
    }

    if (groupResults.length === 0) {
      return res.status(403).json({
        message: "You can only manage your own group chat"
      });
    }

    const checkUserSql = "SELECT * FROM users WHERE id = ?";

    db.query(checkUserSql, [user_id], (userErr, userResults) => {
      if (userErr) {
        console.error("Check user error:", userErr.message);
        return res.status(500).json({
          message: "Database error",
          error: userErr.message
        });
      }

      if (userResults.length === 0) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      const addMemberSql = `
        INSERT INTO group_chat_members (group_chat_id, user_id)
        VALUES (?, ?)
      `;

      db.query(addMemberSql, [groupChatId, user_id], (addErr) => {
        if (addErr) {
          if (addErr.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "User is already in this group"
            });
          }

          console.error("Add member error:", addErr.message);
          return res.status(500).json({
            message: "Failed to add member",
            error: addErr.message
          });
        }

        const notificationSql = `
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          notificationSql,
          [
            user_id,
            "group_chat_invite",
            "Added to Group Chat",
            `You have been added to a group chat (ID ${groupChatId}).`,
            groupChatId
          ],
          (notificationErr) => {
            if (notificationErr) {
              console.error("Create notification error:", notificationErr.message);
            }

            createAuditLog({
              user_id: vendorId,
              action: "add_group_member",
              entity_type: "group_chat",
              entity_id: Number(groupChatId),
              details: `Vendor added user ID ${user_id} to group chat ID ${groupChatId}`
            });

            res.json({
              message: "Member added successfully"
            });
          }
        );
      });
    });
  });
});

// Get my group chats
router.get("/my-groups/list", authMiddleware, (req, res) => {
  const currentUserId = req.user.id;

  const sql = `
    SELECT 
      group_chats.id,
      group_chats.project_id,
      group_chats.group_name,
      group_chats.created_by,
      group_chats.is_archived,
      group_chats.created_at,
      projects.title AS project_title
    FROM group_chat_members
    JOIN group_chats ON group_chat_members.group_chat_id = group_chats.id
    JOIN projects ON group_chats.project_id = projects.id
    WHERE group_chat_members.user_id = ?
    ORDER BY group_chats.created_at DESC
  `;

  db.query(sql, [currentUserId], (err, results) => {
    if (err) {
      console.error("Get my groups error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch group chats",
        error: err.message
      });
    }

    res.json({
      message: "Group chats fetched successfully",
      groups: results
    });
  });
});

// Send message to group
router.post("/:groupChatId/message", authMiddleware, (req, res) => {
  const { groupChatId } = req.params;
  const currentUserId = req.user.id;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      message: "Message is required"
    });
  }

  const checkMemberSql = `
    SELECT * FROM group_chat_members
    WHERE group_chat_id = ? AND user_id = ?
  `;

  db.query(checkMemberSql, [groupChatId, currentUserId], (memberErr, memberResults) => {
    if (memberErr) {
      console.error("Check group member error:", memberErr.message);
      return res.status(500).json({
        message: "Database error",
        error: memberErr.message
      });
    }

    if (memberResults.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this group"
      });
    }

    const insertSql = `
      INSERT INTO group_messages (group_chat_id, sender_id, message)
      VALUES (?, ?, ?)
    `;

    db.query(insertSql, [groupChatId, currentUserId, message], (insertErr, result) => {
      if (insertErr) {
        console.error("Send group message error:", insertErr.message);
        return res.status(500).json({
          message: "Failed to send message",
          error: insertErr.message
        });
      }

      createAuditLog({
        user_id: currentUserId,
        action: "send_group_message",
        entity_type: "group_message",
        entity_id: result.insertId,
        details: `User sent message in group chat ID ${groupChatId}`
      });

      res.status(201).json({
        message: "Group message sent successfully",
        messageId: result.insertId
      });
    });
  });
});

// Get messages in group
router.get("/:groupChatId/messages", authMiddleware, (req, res) => {
  const { groupChatId } = req.params;
  const currentUserId = req.user.id;

  const checkMemberSql = `
    SELECT * FROM group_chat_members
    WHERE group_chat_id = ? AND user_id = ?
  `;

  db.query(checkMemberSql, [groupChatId, currentUserId], (memberErr, memberResults) => {
    if (memberErr) {
      console.error("Check group member error:", memberErr.message);
      return res.status(500).json({
        message: "Database error",
        error: memberErr.message
      });
    }

    if (memberResults.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this group"
      });
    }

    const sql = `
      SELECT 
        group_messages.id,
        group_messages.group_chat_id,
        group_messages.sender_id,
        group_messages.message,
        group_messages.created_at,
        users.username AS sender_username,
        users.email AS sender_email
      FROM group_messages
      JOIN users ON group_messages.sender_id = users.id
      WHERE group_messages.group_chat_id = ?
      ORDER BY group_messages.created_at ASC
    `;

    db.query(sql, [groupChatId], (err, results) => {
      if (err) {
        console.error("Get group messages error:", err.message);
        return res.status(500).json({
          message: "Failed to fetch group messages",
          error: err.message
        });
      }

      res.json({
        message: "Group messages fetched successfully",
        messages: results
      });
    });
  });
});

// Archive group chat (vendor only)
router.put("/:groupChatId/archive", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { groupChatId } = req.params;
  const vendorId = req.user.id;

  const checkGroupSql = `
    SELECT group_chats.*, projects.vendor_id
    FROM group_chats
    JOIN projects ON group_chats.project_id = projects.id
    WHERE group_chats.id = ? AND projects.vendor_id = ?
  `;

  db.query(checkGroupSql, [groupChatId, vendorId], (groupErr, groupResults) => {
    if (groupErr) {
      console.error("Check group ownership error:", groupErr.message);
      return res.status(500).json({
        message: "Database error",
        error: groupErr.message
      });
    }

    if (groupResults.length === 0) {
      return res.status(403).json({
        message: "You can only archive your own group chat"
      });
    }

    const updateSql = `
      UPDATE group_chats
      SET is_archived = TRUE
      WHERE id = ?
    `;

    db.query(updateSql, [groupChatId], (updateErr) => {
      if (updateErr) {
        console.error("Archive group chat error:", updateErr.message);
        return res.status(500).json({
          message: "Failed to archive group chat",
          error: updateErr.message
        });
      }

      createAuditLog({
        user_id: vendorId,
        action: "archive_group_chat",
        entity_type: "group_chat",
        entity_id: Number(groupChatId),
        details: `Vendor archived group chat ID ${groupChatId}`
      });

      res.json({
        message: "Group chat archived successfully"
      });
    });
  });
});

module.exports = router;