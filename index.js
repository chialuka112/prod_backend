const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require("./routes/auth");
const prodRoutes = require("./routes/products")

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});


app.use("/api", authRoutes);
app.use("/api", prodRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});