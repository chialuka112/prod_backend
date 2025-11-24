const express = require("express");
const router = express.Router();
const { Pool } = require ('pg');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',

});


router.post("/signup", async (req, res) => {
  const { name, password, location } = req.body;

  try {
    // check if user already exists to avoid unique constraint violation
    const existing = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user and return the inserted row(s)
    const insertQuery =
      "INSERT INTO users (name, password, location) VALUES ($1, $2, $3) RETURNING id, name, location";

    const result = await pool.query(insertQuery, [name, hashedPassword, location]);

    // send back created user info (omit password)
    // create JWT for the new user
    const createdUser = result.rows[0];
    const payload = { id: createdUser.id, name: createdUser.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    return res.status(201).json({ message: "Signup successful!", user: createdUser, token });
  } catch (error) {
    console.error(error);
    // if Postgres unique violation slips through, return 409
    if (error && error.code === '23505') {
      return res.status(409).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: "Server error during signup." });
  }
});

//login route
router.post("/login", async (req, res) => {
  const { name, password } = req.body;
    try {
    const userQuery = "SELECT * FROM users WHERE name = $1";
    const result = await pool.query(userQuery, [name]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid name or password." });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid name or password." });
    }
    // sign JWT for login
    const payload = { id: user.id, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '1h' });

    res.status(200).json({ message: "Login successful!", user: { id: user.id, name: user.name }, token });
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login." });
  }
});

module.exports = router;