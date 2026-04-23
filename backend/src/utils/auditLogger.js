const db = require("../config/db");

const createAuditLog = ({ user_id = null, action, entity_type, entity_id = null, details = null }) => {
  const sql = `
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, action, entity_type, entity_id, details], (err) => {
    if (err) {
      console.error("Create audit log error:", err.message);
    }
  });
};

module.exports = createAuditLog;