const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "civil_wars",
  password: process.env.DB_PASSWORD || "admin",
  port: parseInt(process.env.DB_PORT || "5433", 10)
});

module.exports = pool;