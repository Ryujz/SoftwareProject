const { getIO } = require("../socket");

function sendRealtimeNotification(userId, notification) {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit("receive_notification", notification);
  } catch (error) {
    console.error("Realtime notification error:", error.message);
  }
}

module.exports = sendRealtimeNotification;