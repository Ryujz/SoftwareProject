const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");
const sendRealtimeNotification = require("../utils/realtimeNotify");

// Create review (vendor only)
// Create review (vendor only)
router.post("/", authMiddleware, roleMiddleware("vendor"), (req, res) => {
  const project_id = Number(req.body.project_id);
  const supplier_id = Number(req.body.supplier_id);
  const rating = Number(req.body.rating);
  const comment = req.body.comment?.trim() || null;
  const vendorId = req.user.id;

  if (!project_id || !supplier_id || Number.isNaN(rating)) {
    return res.status(400).json({
      message: "project_id, supplier_id, and rating are required"
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      message: "Rating must be an integer between 1 and 5"
    });
  }

  const checkProjectSql = "SELECT * FROM projects WHERE id = ? AND vendor_id = ?";

  db.query(checkProjectSql, [project_id, vendorId], (projectErr, projectResults) => {
    if (projectErr) {
      console.error("Check project error:", projectErr.message);
      return res.status(500).json({
        message: "Database error",
        error: projectErr.message
      });
    }

    if (projectResults.length === 0) {
      return res.status(403).json({
        message: "You can only review suppliers for your own project"
      });
    }

    const project = projectResults[0];

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

      const checkDuplicateSql = `
        SELECT * FROM reviews
        WHERE project_id = ? AND supplier_id = ?
      `;

      db.query(checkDuplicateSql, [project_id, supplier_id], (dupErr, dupResults) => {
        if (dupErr) {
          console.error("Check duplicate review error:", dupErr.message);
          return res.status(500).json({
            message: "Database error",
            error: dupErr.message
          });
        }

        if (dupResults.length > 0) {
          return res.status(400).json({
            message: "You have already reviewed this supplier for this project"
          });
        }

        const insertSql = `
          INSERT INTO reviews (project_id, vendor_id, supplier_id, rating, comment)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
          insertSql,
          [project_id, vendorId, supplier_id, rating, comment],
          (insertErr, result) => {
            if (insertErr) {
              console.error("Create review error:", insertErr.message);
              return res.status(500).json({
                message: "Failed to create review",
                error: insertErr.message
              });
            }

            const notificationSql = `
              INSERT INTO notifications (user_id, type, title, message, related_id)
              VALUES (?, ?, ?, ?, ?)
            `;

            const notificationMessage = `You received a new review for project "${project.title}" with rating ${rating}/5.`;

            db.query(
              notificationSql,
              [
                supplier_id,
                "review",
                "New Review Received",
                notificationMessage,
                result.insertId
              ],
              (notificationErr, notificationResult) => {
                if (notificationErr) {
                  console.error("Create notification error:", notificationErr.message);
                } else {
                  sendRealtimeNotification(supplier_id, {
                    id: notificationResult.insertId,
                    type: "review",
                    title: "New Review Received",
                    message: notificationMessage,
                    related_id: result.insertId,
                    created_at: new Date().toISOString()
                  });
                }

                createAuditLog({
                  user_id: vendorId,
                  action: "create_review",
                  entity_type: "review",
                  entity_id: result.insertId,
                  details: `Vendor reviewed supplier ID ${supplier_id} for project ID ${project_id}`
                });

                res.status(201).json({
                  message: "Review created successfully",
                  reviewId: result.insertId
                });
              }
            );
          }
        );
      });
    });
  });
});

// Get reviews for a supplier
router.get("/supplier/:supplierId", (req, res) => {
  const supplierId = req.params.supplierId;

  const sql = `
    SELECT 
      reviews.id,
      reviews.project_id,
      reviews.vendor_id,
      reviews.supplier_id,
      reviews.rating,
      reviews.comment,
      reviews.created_at,
      users.username AS vendor_username,
      projects.title AS project_title
    FROM reviews
    JOIN users ON reviews.vendor_id = users.id
    JOIN projects ON reviews.project_id = projects.id
    WHERE reviews.supplier_id = ?
    ORDER BY reviews.created_at DESC
  `;

  db.query(sql, [supplierId], (err, results) => {
    if (err) {
      console.error("Get supplier reviews error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch reviews",
        error: err.message
      });
    }

    res.json({
      message: "Supplier reviews fetched successfully",
      reviews: results
    });
  });
});

// Get supplier average rating
router.get("/supplier/:supplierId/summary", (req, res) => {
  const supplierId = req.params.supplierId;

  const sql = `
    SELECT 
      supplier_id,
      COUNT(*) AS total_reviews,
      ROUND(AVG(rating), 2) AS average_rating
    FROM reviews
    WHERE supplier_id = ?
    GROUP BY supplier_id
  `;

  db.query(sql, [supplierId], (err, results) => {
    if (err) {
      console.error("Get supplier review summary error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch review summary",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.json({
        message: "No reviews yet",
        summary: {
          supplier_id: Number(supplierId),
          total_reviews: 0,
          average_rating: null
        }
      });
    }

    res.json({
      message: "Supplier review summary fetched successfully",
      summary: results[0]
    });
  });
});

module.exports = router;