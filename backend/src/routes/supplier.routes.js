const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const createAuditLog = require("../utils/auditLogger");

// Get all suppliers + optional search/filter
router.get("/", (req, res) => {
  const { search, business_type } = req.query;

  let sql = `
    SELECT 
      users.id AS user_id,
      users.username,
      users.email,
      users.role,
      supplier_profiles.id AS supplier_profile_id,
      supplier_profiles.company_name,
      supplier_profiles.business_type,
      supplier_profiles.description,
      supplier_profiles.address,
      supplier_profiles.phone
    FROM users
    LEFT JOIN supplier_profiles ON users.id = supplier_profiles.user_id
    WHERE users.role = 'supplier' AND users.is_verified = TRUE
  `;

  const params = [];

  if (search) {
    sql += `
      AND (
        users.username LIKE ?
        OR supplier_profiles.company_name LIKE ?
        OR supplier_profiles.description LIKE ?
      )
    `;
    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword);
  }

  if (business_type) {
    sql += ` AND supplier_profiles.business_type = ? `;
    params.push(business_type);
  }

  sql += ` ORDER BY users.id DESC `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Get suppliers error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch suppliers",
        error: err.message
      });
    }

    res.json({
      message: "Suppliers fetched successfully",
      suppliers: results
    });
  });
});

// Get all portfolios from all suppliers
router.get("/portfolio/all", (req, res) => {
  const sql = `
    SELECT 
      supplier_portfolios.id AS portfolio_id,
      supplier_portfolios.title,
      supplier_portfolios.description,
      supplier_portfolios.image_url,
      supplier_portfolios.created_at,
      supplier_profiles.id AS supplier_profile_id,
      supplier_profiles.company_name,
      supplier_profiles.business_type,
      users.id AS user_id,
      users.username
    FROM supplier_portfolios
    JOIN supplier_profiles ON supplier_portfolios.supplier_profile_id = supplier_profiles.id
    JOIN users ON supplier_profiles.user_id = users.id
    WHERE users.is_verified = TRUE
    ORDER BY supplier_portfolios.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Get all portfolios error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch portfolios",
        error: err.message
      });
    }

    res.json({
      message: "All portfolios fetched successfully",
      portfolios: results
    });
  });
});

// Create or update my supplier profile
router.put("/profile/me", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const company_name = req.body.company_name?.trim();
  const business_type = req.body.business_type?.trim() || null;
  const description = req.body.description?.trim() || null;
  const address = req.body.address?.trim() || null;
  const phone = req.body.phone?.trim() || null;
  const userId = req.user.id;

  if (!company_name) {
    return res.status(400).json({
      message: "Company name is required"
    });
  }

  const checkSql = "SELECT * FROM supplier_profiles WHERE user_id = ?";

  db.query(checkSql, [userId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Check supplier profile error:", checkErr.message);
      return res.status(500).json({
        message: "Database error",
        error: checkErr.message
      });
    }

    if (checkResults.length > 0) {
      const updateSql = `
        UPDATE supplier_profiles
        SET company_name = ?, business_type = ?, description = ?, address = ?, phone = ?
        WHERE user_id = ?
      `;

      db.query(
        updateSql,
        [company_name, business_type, description, address, phone, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Update supplier profile error:", updateErr.message);
            return res.status(500).json({
              message: "Failed to update supplier profile",
              error: updateErr.message
            });
          }

          return res.json({
            message: "Supplier profile updated successfully"
          });
        }
      );
    } else {
      const insertSql = `
        INSERT INTO supplier_profiles
        (user_id, company_name, business_type, description, address, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(
        insertSql,
        [userId, company_name, business_type, description, address, phone],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Create supplier profile error:", insertErr.message);
            return res.status(500).json({
              message: "Failed to create supplier profile",
              error: insertErr.message
            });
          }

          return res.status(201).json({
            message: "Supplier profile created successfully",
            profileId: result.insertId
          });
        }
      );
    }
  });
});

// Get my supplier profile
router.get("/profile/me/view", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const sql = `
    SELECT 
      users.id AS user_id,
      users.username,
      users.email,
      supplier_profiles.id AS supplier_profile_id,
      supplier_profiles.company_name,
      supplier_profiles.business_type,
      supplier_profiles.description,
      supplier_profiles.address,
      supplier_profiles.phone
    FROM users
    LEFT JOIN supplier_profiles ON users.id = supplier_profiles.user_id
    WHERE users.id = ? AND users.role = 'supplier'
  `;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error("Get my supplier profile error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch your supplier profile",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Supplier profile not found"
      });
    }

    res.json({
      message: "My supplier profile fetched successfully",
      supplier: results[0]
    });
  });
});

// Add portfolio item (supplier only)
router.post("/portfolio/me", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim() || null;
  const image_url = req.body.image_url?.trim() || null;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({
      message: "Portfolio title is required"
    });
  }

  const profileSql = "SELECT id FROM supplier_profiles WHERE user_id = ?";

  db.query(profileSql, [userId], (profileErr, profileResults) => {
    if (profileErr) {
      console.error("Find supplier profile error:", profileErr.message);
      return res.status(500).json({
        message: "Database error",
        error: profileErr.message
      });
    }

    if (profileResults.length === 0) {
      return res.status(404).json({
        message: "Please create supplier profile first"
      });
    }

    const supplierProfileId = profileResults[0].id;

    const insertSql = `
      INSERT INTO supplier_portfolios (supplier_profile_id, title, description, image_url)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertSql, [supplierProfileId, title, description, image_url], (insertErr, result) => {
      if (insertErr) {
        console.error("Create portfolio error:", insertErr.message);
        return res.status(500).json({
          message: "Failed to create portfolio",
          error: insertErr.message
        });
      }

      res.status(201).json({
        message: "Portfolio created successfully",
        portfolioId: result.insertId
      });
    });
  });
});

// Get my portfolios (supplier only)
router.get("/portfolio/me/view", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const userId = req.user.id;

  const profileSql = "SELECT id FROM supplier_profiles WHERE user_id = ?";

  db.query(profileSql, [userId], (profileErr, profileResults) => {
    if (profileErr) {
      console.error("Find supplier profile error:", profileErr.message);
      return res.status(500).json({
        message: "Database error",
        error: profileErr.message
      });
    }

    if (profileResults.length === 0) {
      return res.status(404).json({
        message: "Supplier profile not found"
      });
    }

    const supplierProfileId = profileResults[0].id;

    const portfolioSql = `
      SELECT id, title, description, image_url, created_at
      FROM supplier_portfolios
      WHERE supplier_profile_id = ?
      ORDER BY created_at DESC
    `;

    db.query(portfolioSql, [supplierProfileId], (portfolioErr, portfolioResults) => {
      if (portfolioErr) {
        console.error("Get my portfolios error:", portfolioErr.message);
        return res.status(500).json({
          message: "Failed to fetch portfolios",
          error: portfolioErr.message
        });
      }

      res.json({
        message: "My portfolios fetched successfully",
        portfolios: portfolioResults
      });
    });
  });
});

// Delete portfolio item (supplier only)
router.delete("/portfolio/:portfolioId", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const portfolioSql = "DELETE from supplier_portfolios WHERE id = ?";

  db.query(portfolioSql, [portfolioId], (portfolioErr, portfolioResults) => {
    if (portfolioErr) {
      console.error("Find portfolio error:", portfolioErr.message);
      return res.status(500).json({ message: "Database error", error: portfolioErr.message });
    }

    if (portfolioResults.affectedRows === 0) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

        createAuditLog({
          user_id: userId,
          action: "delete_portfolio",
          entity_type: "supplier_portfolio",
          entity_id: Number(portfolioId),
          details: `Supplier deleted portfolio ID ${portfolioId}`
        });

        res.json({ message: "Portfolio deleted successfully" });
      
    });
  });

// Edit portfolio item (supplier only)
// Edit portfolio item (supplier only)
router.put("/portfolio/:portfolioId", authMiddleware, roleMiddleware("supplier"), (req, res) => {
  const { portfolioId } = req.params;
  const title = req.body.title?.trim();
  const description = req.body.description?.trim() || null;
  const image_url = req.body.image_url?.trim() || null;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({
      message: "Portfolio title is required"
    });
  }

  const profileSql = "SELECT id FROM supplier_profiles WHERE user_id = ?";

  db.query(profileSql, [userId], (profileErr, profileResults) => {
    if (profileErr) {
      console.error("Find supplier profile error:", profileErr.message);
      return res.status(500).json({
        message: "Database error",
        error: profileErr.message
      });
    }

    if (profileResults.length === 0) {
      return res.status(404).json({
        message: "Supplier profile not found"
      });
    }

    const supplierProfileId = profileResults[0].id;

    const checkPortfolioSql = `
      SELECT * FROM supplier_portfolios
      WHERE id = ? AND supplier_profile_id = ?
    `;

    db.query(checkPortfolioSql, [portfolioId, supplierProfileId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Check portfolio ownership error:", checkErr.message);
        return res.status(500).json({
          message: "Database error",
          error: checkErr.message
        });
      }

      if (checkResults.length === 0) {
        return res.status(403).json({
          message: "You can only edit your own portfolio"
        });
      }

      const updateSql = `
        UPDATE supplier_portfolios
        SET title = ?, description = ?, image_url = ?
        WHERE id = ? AND supplier_profile_id = ?
      `;

      db.query(
        updateSql,
        [title, description, image_url, portfolioId, supplierProfileId],
        (updateErr) => {
          if (updateErr) {
            console.error("Update portfolio error:", updateErr.message);
            return res.status(500).json({
              message: "Failed to update portfolio",
              error: updateErr.message
            });
          }

          createAuditLog({
            user_id: userId,
            action: "edit_portfolio",
            entity_type: "supplier_portfolio",
            entity_id: Number(portfolioId),
            details: `Supplier updated portfolio ID ${portfolioId}`
          });

          res.json({
            message: "Portfolio updated successfully"
          });
        }
      );
    });
  });
});

// Get supplier by user id + portfolios
router.get("/:id", (req, res) => {
  const supplierSql = `
    SELECT 
      users.id AS user_id,
      users.username,
      users.email,
      users.role,
      supplier_profiles.id AS supplier_profile_id,
      supplier_profiles.company_name,
      supplier_profiles.business_type,
      supplier_profiles.description,
      supplier_profiles.address,
      supplier_profiles.phone
    FROM users
    LEFT JOIN supplier_profiles ON users.id = supplier_profiles.user_id
    WHERE users.role = 'supplier' AND users.is_verified = TRUE AND users.id = ?
  `;

  db.query(supplierSql, [req.params.id], (err, supplierResults) => {
    if (err) {
      console.error("Get supplier by id error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch supplier",
        error: err.message
      });
    }

    if (supplierResults.length === 0) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }

    const supplier = supplierResults[0];

    if (!supplier.supplier_profile_id) {
      return res.json({
        message: "Supplier fetched successfully",
        supplier,
        portfolios: []
      });
    }

    const portfolioSql = `
      SELECT id, title, description, image_url, created_at
      FROM supplier_portfolios
      WHERE supplier_profile_id = ?
      ORDER BY created_at DESC
    `;

    db.query(portfolioSql, [supplier.supplier_profile_id], (portfolioErr, portfolioResults) => {
      if (portfolioErr) {
        console.error("Get portfolios error:", portfolioErr.message);
        return res.status(500).json({
          message: "Failed to fetch portfolios",
          error: portfolioErr.message
        });
      }

      res.json({
        message: "Supplier fetched successfully",
        supplier,
        portfolios: portfolioResults
      });
    });
  });
});

module.exports = router;