'use strict';

/*
 * Player-Repository:
 * Enthält alle SQL-Abfragen für Spielerstammdaten, Login-Suche und Weltkartenliste.
 */

const pool = require('../db');

async function findById(id, client = pool) {
  // Öffentliche Basisdaten eines Spielers nach ID laden.
  const result = await client.query(
    'SELECT id, name, email, koordinate_x, koordinate_y FROM spieler WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findByKoordinaten(x, y, client = pool) {
  // Prüft, ob ein Koordinatenfeld bereits belegt ist.
  const result = await client.query(
    'SELECT id FROM spieler WHERE koordinate_x = $1 AND koordinate_y = $2',
    [x, y]
  );
  return result.rows[0] || null;
}

async function findByNameOrEmail(name, email, client = pool) {
  // Duplikatprüfung bei Registrierung.
  const result = await client.query(
    'SELECT id FROM spieler WHERE name = $1 OR email = $2',
    [name, email]
  );
  return result.rows;
}

async function findByEmail(email, client = pool) {
  // Vollständigen Spieler für Login (inkl. Passwort-Hash) laden.
  const result = await client.query(
    'SELECT * FROM spieler WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

async function create(name, email, passwortHash, koordinateX, koordinateY, client = pool) {
  // Legt einen neuen Spieler an.
  const result = await client.query(
    'INSERT INTO spieler (name, email, passwort_hash, koordinate_x, koordinate_y) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, koordinate_x, koordinate_y',
    [name, email, passwortHash, koordinateX, koordinateY]
  );
  return result.rows[0];
}

// Alle Spieler mit Koordinaten für die Weltkartenansicht laden.
async function findAll(client = pool) {
  const result = await client.query(
    'SELECT id, name, koordinate_x, koordinate_y FROM spieler ORDER BY name'
  );
  return result.rows;
}

module.exports = { findById, findByNameOrEmail, findByEmail, findByKoordinaten, findAll, create };
