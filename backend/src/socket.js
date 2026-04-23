const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./config/db");
const createAuditLog = require("./utils/auditLogger");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // JWT auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Authenticated socket connected:", socket.id, socket.user);

    // personal room for notifications
    socket.join(`user:${socket.user.id}`);

    // Join private chat room with authorization
    socket.on("join_private_chat", ({ chatId }) => {
      if (!chatId) return;

      const currentUserId = socket.user.id;

      const checkChatSql = `
        SELECT * FROM private_chats
        WHERE id = ? AND (user1_id = ? OR user2_id = ?)
      `;

      db.query(checkChatSql, [chatId, currentUserId, currentUserId], (err, results) => {
        if (err) {
          console.error("Join private chat auth error:", err.message);
          socket.emit("socket_error", { message: "Database error while joining private chat" });
          return;
        }

        if (results.length === 0) {
          socket.emit("socket_error", { message: "You do not have access to this private chat" });
          return;
        }

        socket.join(`private_chat_${chatId}`);
        socket.emit("joined_private_chat", { chatId: Number(chatId) });
      });
    });

    // Join group chat room with authorization
    socket.on("join_group_chat", ({ groupChatId }) => {
      if (!groupChatId) return;

      const currentUserId = socket.user.id;

      const checkMemberSql = `
        SELECT * FROM group_chat_members
        WHERE group_chat_id = ? AND user_id = ?
      `;

      db.query(checkMemberSql, [groupChatId, currentUserId], (err, results) => {
        if (err) {
          console.error("Join group chat auth error:", err.message);
          socket.emit("socket_error", { message: "Database error while joining group chat" });
          return;
        }

        if (results.length === 0) {
          socket.emit("socket_error", { message: "You are not a member of this group" });
          return;
        }

        socket.join(`group_chat_${groupChatId}`);
        socket.emit("joined_group_chat", { groupChatId: Number(groupChatId) });
      });
    });

    // Send private message in real-time + save to DB
    socket.on("send_private_message", ({ chatId, message }) => {
      if (!chatId || !message) return;

      const currentUserId = socket.user.id;

      const checkChatSql = `
        SELECT * FROM private_chats
        WHERE id = ? AND (user1_id = ? OR user2_id = ?)
      `;

      db.query(checkChatSql, [chatId, currentUserId, currentUserId], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Socket private chat access check error:", checkErr.message);
          socket.emit("socket_error", { message: "Database error" });
          return;
        }

        if (checkResults.length === 0) {
          socket.emit("socket_error", { message: "You do not have access to this private chat" });
          return;
        }

        const insertSql = `
          INSERT INTO private_messages (chat_id, sender_id, message)
          VALUES (?, ?, ?)
        `;

        db.query(insertSql, [chatId, currentUserId, message], (err, result) => {
          if (err) {
            console.error("Socket private message insert error:", err.message);
            socket.emit("socket_error", { message: "Failed to send private message" });
            return;
          }

          const payload = {
            id: result.insertId,
            chat_id: Number(chatId),
            sender_id: currentUserId,
            sender_email: socket.user.email,
            message,
            created_at: new Date().toISOString()
          };

          io.to(`private_chat_${chatId}`).emit("receive_private_message", payload);

          createAuditLog({
            user_id: currentUserId,
            action: "socket_private_message",
            entity_type: "private_message",
            entity_id: result.insertId,
            details: `User sent real-time private message in chat ID ${chatId}`
          });
        });
      });
    });

    // Send group message in real-time + save to DB
    socket.on("send_group_message", ({ groupChatId, message }) => {
      if (!groupChatId || !message) return;

      const currentUserId = socket.user.id;

      const checkMemberSql = `
        SELECT * FROM group_chat_members
        WHERE group_chat_id = ? AND user_id = ?
      `;

      db.query(checkMemberSql, [groupChatId, currentUserId], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Socket group membership check error:", checkErr.message);
          socket.emit("socket_error", { message: "Database error" });
          return;
        }

        if (checkResults.length === 0) {
          socket.emit("socket_error", { message: "You are not a member of this group" });
          return;
        }

        const insertSql = `
          INSERT INTO group_messages (group_chat_id, sender_id, message)
          VALUES (?, ?, ?)
        `;

        db.query(insertSql, [groupChatId, currentUserId, message], (err, result) => {
          if (err) {
            console.error("Socket group message insert error:", err.message);
            socket.emit("socket_error", { message: "Failed to send group message" });
            return;
          }

          const payload = {
            id: result.insertId,
            group_chat_id: Number(groupChatId),
            sender_id: currentUserId,
            sender_email: socket.user.email,
            message,
            created_at: new Date().toISOString()
          };

          io.to(`group_chat_${groupChatId}`).emit("receive_group_message", payload);

          createAuditLog({
            user_id: currentUserId,
            action: "socket_group_message",
            entity_type: "group_message",
            entity_id: result.insertId,
            details: `User sent real-time group message in group chat ID ${groupChatId}`
          });
        });
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}

module.exports = { initSocket, getIO };