'use strict';

const pool = require('../db');

async function findById(id, client = pool) {
  const result = await client.query(
    'SELECT id, name, email, koordinate_x, koordinate_y FROM spieler WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findByKoordinaten(x, y, client = pool) {
  const result = await client.query(
    'SELECT id FROM spieler WHERE koordinate_x = $1 AND koordinate_y = $2',
    [x, y]
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

async function create(name, email, passwortHash, koordinateX, koordinateY, client = pool) {
  const result = await client.query(
    'INSERT INTO spieler (name, email, passwort_hash, koordinate_x, koordinate_y) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, koordinate_x, koordinate_y',
    [name, email, passwortHash, koordinateX, koordinateY]
  );
  return result.rows[0];
}

/* Alle Spieler mit ihren Koordinaten laden (für die Weltkarte) */
async function findAll(client = pool) {
  const result = await client.query(
    'SELECT id, name, koordinate_x, koordinate_y FROM spieler ORDER BY name'
  );
  return result.rows;
}

module.exports = { findById, findByNameOrEmail, findByEmail, findByKoordinaten, findAll, create };
