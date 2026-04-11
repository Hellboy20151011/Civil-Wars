'use strict';

const pool = require('../db');

async function findById(id, client = pool) {
  const result = await client.query(
    'SELECT id, name, email FROM spieler WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findByNameOrEmail(name, email, client = pool) {
  const result = await client.query(
    'SELECT id FROM spieler WHERE name = $1 OR email = $2',
    [name, email]
  );
  return result.rows;
}

async function findByEmail(email, client = pool) {
  const result = await client.query(
    'SELECT * FROM spieler WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function create(name, email, passwortHash, client = pool) {
  const result = await client.query(
    'INSERT INTO spieler (name, email, passwort_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, passwortHash]
  );
  return result.rows[0];
}

module.exports = { findById, findByNameOrEmail, findByEmail, create };
