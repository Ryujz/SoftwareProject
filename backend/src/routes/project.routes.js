const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");
const sendRealtimeNotification = require("../utils/realtimeNotify");

// Get all projects
router.get("/", (req, res) => {
  const sql = `
    SELECT projects.*, users.username AS vendor_name, users.email AS vendor_email
    FROM projects
    JOIN users ON projects.vendor_id = users.id
    ORDER BY projects.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get projects error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch projects",
        error: err.message
      });
    }

    res.json({
      message: "Projects fetched successfully",
      projects: results
    });
  });
});

// Get my projects (vendor only)
router.get("/my-projects", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const sql = "SELECT * FROM projects WHERE vendor_id = ? ORDER BY created_at DESC";

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Get my projects error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch your projects",
        error: err.message
      });
    }

    res.json({
      message: "My projects fetched successfully",
      projects: results
    });
  });
});

// Get all interests for all my projects (vendor only)
router.get("/my-project-interests", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const sql = `
    SELECT 
      project_interests.id,
      project_interests.project_id,
      project_interests.supplier_id,
      project_interests.message,
      project_interests.created_at,
      projects.title AS project_title,
      users.username AS supplier_username,
      users.email AS supplier_email
    FROM project_interests
    JOIN projects ON project_interests.project_id = projects.id
    JOIN users ON project_interests.supplier_id = users.id
    WHERE projects.vendor_id = ?
    ORDER BY project_interests.created_at DESC
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Get my project interests error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch interests",
        error: err.message
      });
    }

    res.json({
      message: "Project interests fetched successfully",
      interests: results
    });
  });
});

// Get project by id
router.get("/:id", (req, res) => {
  const sql = `
    SELECT projects.*, users.username AS vendor_name, users.email AS vendor_email
    FROM projects
    JOIN users ON projects.vendor_id = users.id
    WHERE projects.id = ?
  `;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error("Get project by id error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch project",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    res.json({
      message: "Project fetched successfully",
      project: results[0]
    });
  });
});

// Get interests of a specific project (owner vendor only)
router.get("/:id/interests", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const projectId = req.params.id;
  const vendorId = req.user.id;

  const checkSql = "SELECT * FROM projects WHERE id = ? AND vendor_id = ?";

  db.query(checkSql, [projectId, vendorId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check project ownership error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({
        message: "You can only view interests of your own project"
      });
    }

    const interestSql = `
      SELECT 
        project_interests.id,
        project_interests.project_id,
        project_interests.supplier_id,
        project_interests.message,
        project_interests.created_at,
        users.username AS supplier_username,
        users.email AS supplier_email
      FROM project_interests
      JOIN users ON project_interests.supplier_id = users.id
      WHERE project_interests.project_id = ?
      ORDER BY project_interests.created_at DESC
    `;

    db.query(interestSql, [projectId], (interestErr, interestResults) => {
      if (interestErr) {
        console.error("Get project interests error:", interestErr.message);
        return res.status(500).json({
          message: "Failed to fetch project interests",
          error: interestErr.message
        });
      }

      res.json({
        message: "Project interests fetched successfully",
        interests: interestResults
      });
    });
  });
});

// Supplier interested in project
router.post("/:id/interested", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const projectId = req.params.id;
  const supplierId = req.user.id;
  const message = req.body.message?.trim() || null;

  const checkProjectSql = "SELECT * FROM projects WHERE id = ?";

  db.query(checkProjectSql, [projectId], (projectErr, projectResults) => {
    if (projectErr) {
      console.error("Check project error:", projectErr.message);
      return res.status(500).json({
        message: "Database error",
        error: projectErr.message
      });
    }

    if (projectResults.length === 0) {
      return res.status(404).json({
        message: "Project not found"
      });
    }

    const project = projectResults[0];

    const checkInterestSql = `
      SELECT * FROM project_interests
      WHERE project_id = ? AND supplier_id = ?
    `;

    db.query(checkInterestSql, [projectId, supplierId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check interest error:", checkErr.message);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message
        });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({
          message: "You have already expressed interest in this project"
        });
      }

      const insertSql = `
        INSERT INTO project_interests (project_id, supplier_id, message)
        VALUES (?, ?, ?)
      `;
      
      db.query(insertSql, [projectId, supplierId, message], (insertErr, result) => {
        if (insertErr) {
          console.error("Create interest error:", insertErr.message);
          return res.status(500).json({
            message: "Failed to submit interest",
            error: insertErr.message
          });
        }

        const notificationSql = `
          INSERT INTO notifications (user_id, type, title, message, related_id)
          VALUES (?, ?, ?, ?, ?)
        `;

        const notificationMessage = `A supplier has shown interest in your project "${project.title}".`;

        db.query(
            notificationSql,
            [
                project.vendor_id,
                "project_interest",
                "New Project Interest",
                notificationMessage,
                projectId
            ],
            (notificationErr, notificationResult) => {
                if (notificationErr) {
                console.error("Create notification error:", notificationErr.message);
                } else {
                sendRealtimeNotification(project.vendor_id, {
                    id: notificationResult.insertId,
                    type: "project_interest",
                    title: "New Project Interest",
                    message: notificationMessage,
                    related_id: Number(projectId),
                    created_at: new Date().toISOString()
                });
                }

                createAuditLog({
                user_id: supplierId,
                action: "project_interest",
                entity_type: "project_interest",
                entity_id: result.insertId,
                details: `Supplier expressed interest in project ID ${projectId}`
                });

                res.status(201).json({
                message: "Interest submitted successfully",
                interestId: result.insertId
                });
            }
        );
      });
    });
  });
});

// Create project (vendor only)
router.post("/", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const budget = Number(req.body.budget);

  if (!title || !description || Number.isNaN(budget) || budget <= 0) {
    return res.status(400).json({
      message: "Valid title, description, and positive budget are required"
    });
  }

  const sql = `
    INSERT INTO projects (vendor_id, title, description, budget)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [req.user.id, title, description, budget], (err, result) => {
    if (err) {
      console.error("Create project error:", err.message);
      return res.status(500).json({
        message: "Failed to create project",
        error: err.message
      });
    }

    createAuditLog({
      user_id: req.user.id,
      action: "create_project",
      entity_type: "project",
      entity_id: result.insertId,
      details: `Vendor created project "${title}"`
    });

    res.status(201).json({
      message: "Project created successfully",
      projectId: result.insertId
    });
  });
});

// Complete project (owner vendor only)
router.put("/:id/complete", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const projectId = req.params.id;
  const vendorId = req.user.id;

  const checkProjectSql = "SELECT * FROM projects WHERE id = ? AND vendor_id = ?";

  db.query(checkProjectSql, [projectId, vendorId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check project ownership error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({
        message: "You can only complete your own project"
      });
    }

    const project = checkResults[0];

    const updateProjectSql = `
      UPDATE projects
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND vendor_id = ?
    `;

    db.query(updateProjectSql, [projectId, vendorId], (updateErr) => {
      if (updateErr) {
        console.error("Complete project error:", updateErr.message);
        return res.status(500).json({
          message: "Failed to complete project",
          error: updateErr.message
        });
      }

      const archiveGroupSql = `
        UPDATE group_chats
        SET is_archived = TRUE
        WHERE project_id = ?
      `;

      db.query(archiveGroupSql, [projectId], (archiveErr) => {
        if (archiveErr) {
          console.error("Archive group chats error:", archiveErr.message);
          return res.status(500).json({
            message: "Project completed but failed to archive related groups",
            error: archiveErr.message
          });
        }

        const memberSql = `
          SELECT DISTINCT group_chat_members.user_id
          FROM group_chat_members
          JOIN group_chats ON group_chat_members.group_chat_id = group_chats.id
          WHERE group_chats.project_id = ? AND group_chat_members.user_id != ?
        `;

        db.query(memberSql, [projectId, vendorId], (memberErr, memberResults) => {
          if (memberErr) {
            console.error("Fetch project group members error:", memberErr.message);
            return res.status(500).json({
              message: "Project completed but failed to fetch group members",
              error: memberErr.message
            });
          }

          const notificationSql = `
            INSERT INTO notifications (user_id, type, title, message, related_id)
            VALUES (?, ?, ?, ?, ?)
          `;

          const notificationMessage = `The vendor has marked project "${project.title}" as completed.`;

          if (memberResults.length === 0) {
            createAuditLog({
              user_id: vendorId,
              action: "complete_project",
              entity_type: "project",
              entity_id: Number(projectId),
              details: `Vendor marked project "${project.title}" as completed`
            });

            return res.json({
              message: "Project completed successfully"
            });
          }

          let completedCount = 0;

          memberResults.forEach((member) => {
            db.query(
              notificationSql,
              [
                member.user_id,
                "project_completed",
                "Project Completed",
                notificationMessage,
                projectId
              ],
              (notificationErr, notificationResult) => {
                if (notificationErr) {
                  console.error("Create project complete notification error:", notificationErr.message);
                } else {
                  sendRealtimeNotification(member.user_id, {
                    id: notificationResult.insertId,
                    type: "project_completed",
                    title: "Project Completed",
                    message: notificationMessage,
                    related_id: Number(projectId),
                    created_at: new Date().toISOString()
                  });
                }

                completedCount++;

                if (completedCount === memberResults.length) {
                  createAuditLog({
                    user_id: vendorId,
                    action: "complete_project",
                    entity_type: "project",
                    entity_id: Number(projectId),
                    details: `Vendor marked project "${project.title}" as completed`
                  });

                  res.json({
                    message: "Project completed successfully"
                  });
                }
              }
            );
          });
        });
      });
    });
  });
});

// Update project (owner vendor only)
router.put("/:id", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const budget = Number(req.body.budget);
  const projectId = req.params.id;
  const vendorId = req.user.id;

  if (!title || !description || Number.isNaN(budget) || budget <= 0) {
    return res.status(400).json({
      message: "Valid title, description, and positive budget are required"
    });
  }

  const checkSql = "SELECT * FROM projects WHERE id = ? AND vendor_id = ?";

  db.query(checkSql, [projectId, vendorId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check project ownership error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length === 0) {
      return res.status(403).json({
        message: "You can only edit your own project"
      });
    }

    const updateSql = `
      UPDATE projects
      SET title = ?, description = ?, budget = ?
      WHERE id = ? AND vendor_id = ?
    `;

    db.query(updateSql, [title, description, budget, projectId, vendorId], (updateErr) => {
      if (updateErr) {
        console.error("Update project error:", updateErr.message);
        return res.status(500).json({
          message: "Failed to update project",
          error: updateErr.message
        });
      }

      res.json({
        message: "Project updated successfully"
      });
    });
  });
});

module.exports = router;