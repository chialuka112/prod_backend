const express = require("express");
const router = express.Router();
const { Pool } = require ('pg');
const bcrypt = require("bcryptjs");
const verifyToken = require('../middleware/auth');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});


function generateCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post("/save", verifyToken, async (req, res) => {
  const { productName, manufacturer, dateCreated, dateExpired ,description } = req.body;

  // Debug incoming payload
  console.log('POST /api/save payload:', req.body);

  try {
    const randomCode = generateCode(10); // 10-character code

    await pool.query(
      "INSERT INTO items (productname, manufacturer, dateCreated, dateExpired, description, code) VALUES ($1, $2, $3, $4, $5, $6)",
      [productName, manufacturer, dateCreated,dateExpired ,description, randomCode]
    );

    console.log('Inserted item with code:', randomCode);

    res.json({ 
      message: "Saved successfully",
      code: randomCode 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving data" });
  }
});


// GET /api/products - return all products
router.get("/product/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM items WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;