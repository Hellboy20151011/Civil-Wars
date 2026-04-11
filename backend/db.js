const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "civil_wars",
  password: "admin",
  port: 5433
});

module.exports = pool;