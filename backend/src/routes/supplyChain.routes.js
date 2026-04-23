const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");
const sendRealtimeNotification = require("../utils/realtimeNotify");

// Vendor creates a task in project
router.post("/:projectId/tasks", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { projectId } = req.params;
  const supplier_id = Number(req.body.supplier_id);
  const task_name = req.body.task_name?.trim();
  const task_order = Number(req.body.task_order);
  const note = req.body.note?.trim() || null;
  const vendorId = req.user.id;

  if (!supplier_id || !task_name || !Number.isInteger(task_order) || task_order <= 0) {
    return res.status(400).json({
      message: "Valid supplier_id, task_name, and positive task_order are required"
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
        message: "You can only manage supply chain of your own project"
      });
    }

    const checkSupplierSql = "SELECT * FROM users WHERE id = ? AND role = 'supplier'";

    db.query(checkSupplierSql, [supplier_id], (supplierErr, supplierResults) => {
      if (supplierErr) {
        console.error("Check supplier error:", supplierErr.message);
        return res.status(500).json({
          message: "Database error",
          error: supplierErr.message
        });
      }

      if (supplierResults.length === 0) {
        return res.status(404).json({
          message: "Supplier not found"
        });
      }

      const insertSql = `
        INSERT INTO supply_chain_tasks (project_id, supplier_id, task_name, task_order, note)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [projectId, supplier_id, task_name, task_order, note],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Create supply chain task error:", insertErr.message);
            return res.status(500).json({
              message: "Failed to create task",
              error: insertErr.message
            });
          }

          const notificationSql = `
            INSERT INTO notifications (user_id, type, title, message, related_id)
            VALUES (?, ?, ?, ?, ?)
          `;

          const notificationMessage = `You have been assigned a new task "${task_name}" in project ID ${projectId}.`;

          db.query(
            notificationSql,
            [
              supplier_id,
              "supply_chain_task",
              "New Supply Chain Task",
              notificationMessage,
              result.insertId
            ],
            (notificationErr) => {
              if (notificationErr) {
                console.error("Create notification error:", notificationErr.message);
              }

              createAuditLog({
                user_id: vendorId,
                action: "create_supply_chain_task",
                entity_type: "supply_chain_task",
                entity_id: result.insertId,
                details: `Vendor assigned task "${task_name}" to supplier ID ${supplier_id} in project ID ${projectId}`
                });

              res.status(201).json({
                message: "Supply chain task created successfully",
                taskId: result.insertId
              });
            }
          );
        }
      );
    });
  });
});

// Vendor views all tasks in a project
router.get("/:projectId/tasks", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { projectId } = req.params;
  const vendorId = req.user.id;

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
        message: "You can only view supply chain of your own project"
      });
    }

    const taskSql = `
      SELECT 
        supply_chain_tasks.*,
        users.username AS supplier_username,
        users.email AS supplier_email
      FROM supply_chain_tasks
      JOIN users ON supply_chain_tasks.supplier_id = users.id
      WHERE supply_chain_tasks.project_id = ?
      ORDER BY supply_chain_tasks.task_order ASC
    `;

    db.query(taskSql, [projectId], (taskErr, taskResults) => {
      if (taskErr) {
        console.error("Get supply chain tasks error:", taskErr.message);
        return res.status(500).json({
          message: "Failed to fetch tasks",
          error: taskErr.message
        });
      }

      res.json({
        message: "Supply chain tasks fetched successfully",
        tasks: taskResults
      });
    });
  });
});

// Supplier views tasks assigned to them
router.get("/my-tasks/list", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const supplierId = req.user.id;

  const sql = `
    SELECT 
      supply_chain_tasks.*,
      projects.title AS project_title
    FROM supply_chain_tasks
    JOIN projects ON supply_chain_tasks.project_id = projects.id
    WHERE supply_chain_tasks.supplier_id = ?
    ORDER BY supply_chain_tasks.updated_at DESC
  `;

  db.query(sql, [supplierId], (err, results) => {
    if (err) {
      console.error("Get my supply chain tasks error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch your tasks",
        error: err.message
      });
    }

    res.json({
      message: "My supply chain tasks fetched successfully",
      tasks: results
    });
  });
});

// Supplier updates own task status
router.put("/tasks/:taskId/status", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const { taskId } = req.params;
  const status = req.body.status?.trim();
  const note = req.body.note?.trim() || null;
  const supplierId = req.user.id;

  const allowedStatus = ["pending", "in_progress", "completed"];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      message: "Status must be pending, in_progress, or completed"
    });
  }

  const checkTaskSql = "SELECT * FROM supply_chain_tasks WHERE id = ? AND supplier_id = ?";

  db.query(checkTaskSql, [taskId, supplierId], (taskErr, taskResults) => {
    if (taskErr) {
      console.error("Check task error:", taskErr.message);
      return res.status(500).json({
        message: "Database error",
        error: taskErr.message
      });
    }

    if (taskResults.length === 0) {
      return res.status(403).json({
        message: "You can only update your own task"
      });
    }

    const task = taskResults[0];

    const updateSql = `
      UPDATE supply_chain_tasks
      SET status = ?, note = ?
      WHERE id = ? AND supplier_id = ?
    `;

    db.query(updateSql, [status, note, taskId, supplierId], (updateErr) => {
      if (updateErr) {
        console.error("Update task status error:", updateErr.message);
        return res.status(500).json({
          message: "Failed to update task status",
          error: updateErr.message
        });
      }

      const projectSql = "SELECT * FROM projects WHERE id = ?";

      db.query(projectSql, [task.project_id], (projectErr, projectResults) => {
        if (projectErr || projectResults.length === 0) {
          if (projectErr) {
            console.error("Fetch project for notification error:", projectErr.message);
          }

          createAuditLog({
            user_id: supplierId,
            action: "update_task_status",
            entity_type: "supply_chain_task",
            entity_id: Number(taskId),
            details: `Supplier updated task "${task.task_name}" to status "${status}"`
          });

          return res.json({
            message: "Task status updated successfully"
          });
        }

        const project = projectResults[0];

        const notificationSql = `
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, ?, ?, ?, ?)
        `;

        const vendorMessage = `A supplier updated task "${task.task_name}" to status "${status}" in your project "${project.title}".`;

        db.query(
          notificationSql,
          [
            project.vendor_id,
            "task_status_update",
            "Supply Chain Task Updated",
            vendorMessage,
            taskId
          ],
          (vendorNotificationErr, vendorNotificationResult) => {
            if (vendorNotificationErr) {
              console.error("Create vendor notification error:", vendorNotificationErr.message);
            } else {
              sendRealtimeNotification(project.vendor_id, {
                id: vendorNotificationResult.insertId,
                type: "task_status_update",
                title: "Supply Chain Task Updated",
                message: vendorMessage,
                related_id: Number(taskId),
                created_at: new Date().toISOString()
              });
            }

            const otherSuppliersSql = `
              SELECT DISTINCT supplier_id
              FROM supply_chain_tasks
              WHERE project_id = ? AND supplier_id != ?
            `;

            db.query(otherSuppliersSql, [task.project_id, supplierId], (otherErr, otherResults) => {
              if (otherErr) {
                console.error("Fetch other suppliers error:", otherErr.message);

                createAuditLog({
                  user_id: supplierId,
                  action: "update_task_status",
                  entity_type: "supply_chain_task",
                  entity_id: Number(taskId),
                  details: `Supplier updated task "${task.task_name}" to status "${status}"`
                });

                return res.json({
                  message: "Task status updated successfully"
                });
              }

              if (otherResults.length === 0) {
                createAuditLog({
                  user_id: supplierId,
                  action: "update_task_status",
                  entity_type: "supply_chain_task",
                  entity_id: Number(taskId),
                  details: `Supplier updated task "${task.task_name}" to status "${status}"`
                });

                return res.json({
                  message: "Task status updated successfully"
                });
              }

              let doneCount = 0;
              const otherSupplierMessage = `Another supplier updated task "${task.task_name}" to status "${status}" in project "${project.title}".`;

              otherResults.forEach((row) => {
                db.query(
                  notificationSql,
                  [
                    row.supplier_id,
                    "other_supplier_task_update",
                    "Project Progress Updated",
                    otherSupplierMessage,
                    taskId
                  ],
                  (otherNotificationErr, otherNotificationResult) => {
                    if (otherNotificationErr) {
                      console.error("Create other supplier notification error:", otherNotificationErr.message);
                    } else {
                      sendRealtimeNotification(row.supplier_id, {
                        id: otherNotificationResult.insertId,
                        type: "other_supplier_task_update",
                        title: "Project Progress Updated",
                        message: otherSupplierMessage,
                        related_id: Number(taskId),
                        created_at: new Date().toISOString()
                      });
                    }

                    doneCount++;

                    if (doneCount === otherResults.length) {
                      createAuditLog({
                        user_id: supplierId,
                        action: "update_task_status",
                        entity_type: "supply_chain_task",
                        entity_id: Number(taskId),
                        details: `Supplier updated task "${task.task_name}" to status "${status}"`
                      });

                      return res.json({
                        message: "Task status updated successfully"
                      });
                    }
                  }
                );
              });
            });
          }
        );
      });
    });
  });
});

// Vendor edits a supply chain task
router.put("/tasks/:taskId", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const { taskId } = req.params;
  const supplier_id = Number(req.body.supplier_id);
  const task_name = req.body.task_name?.trim();
  const task_order = Number(req.body.task_order);
  const note = req.body.note?.trim() || null;
  const vendorId = req.user.id;

  if (!supplier_id || !task_name || !Number.isInteger(task_order) || task_order <= 0) {
    return res.status(400).json({
      message: "Valid supplier_id, task_name, and positive task_order are required"
    });
  }

  const checkTaskSql = `
    SELECT supply_chain_tasks.*, projects.vendor_id, projects.title AS project_title
    FROM supply_chain_tasks
    JOIN projects ON supply_chain_tasks.project_id = projects.id
    WHERE supply_chain_tasks.id = ? AND projects.vendor_id = ?
  `;

  db.query(checkTaskSql, [taskId, vendorId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check task ownership error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({
        message: "You can only edit tasks in your own project"
      });
    }

    const oldTask = checkResults[0];

    const checkSupplierSql = "SELECT * FROM users WHERE id = ? AND role = 'supplier'";

    db.query(checkSupplierSql, [supplier_id], (supplierErr, supplierResults) => {
      if (supplierErr) {
        console.error("Check supplier error:", supplierErr.message);
        return res.status(500).json({
          message: "Database error",
          error: supplierErr.message
        });
      }

      if (supplierResults.length === 0) {
        return res.status(404).json({
          message: "Supplier not found"
        });
      }

      const updateSql = `
        UPDATE supply_chain_tasks
        SET supplier_id = ?, task_name = ?, task_order = ?, note = ?
        WHERE id = ?
      `;

      db.query(
        updateSql,
        [supplier_id, task_name, task_order, note, taskId],
        (updateErr) => {
          if (updateErr) {
            console.error("Update supply chain task error:", updateErr.message);
            return res.status(500).json({
              message: "Failed to update supply chain task",
              error: updateErr.message
            });
          }

          // notify new supplier if changed
          if (Number(oldTask.supplier_id) !== Number(supplier_id)) {
            const notificationSql = `
              INSERT INTO notifications (user_id, type, title, message, related_id)
              VALUES (?, ?, ?, ?, ?)
            `;

            const notificationMessage = `You have been assigned an updated task "${task_name}" in project "${oldTask.project_title}".`;

            db.query(
              notificationSql,
              [
                supplier_id,
                "supply_chain_task_updated",
                "Supply Chain Task Updated",
                notificationMessage,
                taskId
              ],
              (notificationErr, notificationResult) => {
                if (notificationErr) {
                  console.error("Create notification error:", notificationErr.message);
                } else {
                  sendRealtimeNotification(supplier_id, {
                    id: notificationResult.insertId,
                    type: "supply_chain_task_updated",
                    title: "Supply Chain Task Updated",
                    message: notificationMessage,
                    related_id: Number(taskId),
                    created_at: new Date().toISOString()
                  });
                }

                createAuditLog({
                  user_id: vendorId,
                  action: "edit_supply_chain_task",
                  entity_type: "supply_chain_task",
                  entity_id: Number(taskId),
                  details: `Vendor updated task "${task_name}" in project ID ${oldTask.project_id}`
                });

                return res.json({
                  message: "Supply chain task updated successfully"
                });
              }
            );
          } else {
            createAuditLog({
              user_id: vendorId,
              action: "edit_supply_chain_task",
              entity_type: "supply_chain_task",
              entity_id: Number(taskId),
              details: `Vendor updated task "${task_name}" in project ID ${oldTask.project_id}`
            });

            return res.json({
              message: "Supply chain task updated successfully"
            });
          }
        }
      );
    });
  });
});

// Supplier views all tasks in a project they are involved in
router.get("/project/:projectId/overview", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const { projectId } = req.params;
  const supplierId = req.user.id;

  const checkAccessSql = `
    SELECT * FROM supply_chain_tasks
    WHERE project_id = ? AND supplier_id = ?
  `;

  db.query(checkAccessSql, [projectId, supplierId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check supplier project access error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({
        message: "You can only view supply chain overview for projects you are involved in"
      });
    }

    const overviewSql = `
      SELECT 
        supply_chain_tasks.id,
        supply_chain_tasks.project_id,
        supply_chain_tasks.supplier_id,
        supply_chain_tasks.task_name,
        supply_chain_tasks.task_order,
        supply_chain_tasks.status,
        supply_chain_tasks.note,
        supply_chain_tasks.created_at,
        supply_chain_tasks.updated_at,
        users.username AS supplier_username,
        users.email AS supplier_email
      FROM supply_chain_tasks
      JOIN users ON supply_chain_tasks.supplier_id = users.id
      WHERE supply_chain_tasks.project_id = ?
      ORDER BY supply_chain_tasks.task_order ASC
    `;

    db.query(overviewSql, [projectId], (overviewErr, overviewResults) => {
      if (overviewErr) {
        console.error("Get supply chain overview error:", overviewErr.message);
        return res.status(500).json({
          message: "Failed to fetch supply chain overview",
          error: overviewErr.message
        });
      }

      res.json({
        message: "Supply chain overview fetched successfully",
        tasks: overviewResults
      });
    });
  });
});

module.exports = router;