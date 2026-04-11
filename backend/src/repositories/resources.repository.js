'use strict';

const pool = require('../db');

async function findBySpielerIdLocked(spielerId, client = pool) {
  const result = await client.query(
    `SELECT spieler_id, geld, stein, eisen, treibstoff, letzte_aktualisierung
     FROM spieler_ressourcen
     WHERE spieler_id = $1
     FOR UPDATE`,
    [spielerId]
  );
  return result.rows[0] || null;
}

async function initForSpieler(spielerId, client = pool) {
  await client.query(
    `INSERT INTO spieler_ressourcen (spieler_id, letzte_aktualisierung)
     VALUES ($1, CURRENT_TIMESTAMP)`,
    [spielerId]
  );
}

async function addResources(
  spielerId,
  addGeld,
  addStein,
  addEisen,
  addTreibstoff,
  neueLetzteAktualisierung,
  client = pool
) {
  const result = await client.query(
    `UPDATE spieler_ressourcen
     SET geld = geld + $1,
         stein = stein + $2,
         eisen = eisen + $3,
         treibstoff = treibstoff + $4,
         letzte_aktualisierung = $5
     WHERE spieler_id = $6
     RETURNING geld, stein, eisen, treibstoff, letzte_aktualisierung`,
    [addGeld, addStein, addEisen, addTreibstoff, neueLetzteAktualisierung, spielerId]
  );
  return result.rows[0];
}

async function deductResources(spielerId, geld, stein, eisen, treibstoff, client = pool) {
  await client.query(
    `UPDATE spieler_ressourcen
     SET geld = geld - $1,
         stein = stein - $2,
         eisen = eisen - $3,
         treibstoff = treibstoff - $4
     WHERE spieler_id = $5`,
    [geld, stein, eisen, treibstoff, spielerId]
  );
}

module.exports = {
  findBySpielerIdLocked,
  initForSpieler,
  addResources,
  deductResources,
};
