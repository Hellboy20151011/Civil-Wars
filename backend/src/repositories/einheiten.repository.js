'use strict';

/*
 * Einheiten-Repository:
 * Kapselt SQL-Zugriffe für Einheitentypen und den Einheitenbestand eines Spielers.
 */

const pool = require('../db');

async function findSpielerEinheiten(spielerId, client = pool) {
  // Einheitentypen mit aktuellem Bestand des Spielers zusammenführen.
  const result = await client.query(
    `SELECT
        et.id,
        et.name,
        et.kaserne_stufe_min,
        et.angriff,
        et.abwehr,
        et.kosten_geld,
        et.kosten_stein,
        et.kosten_eisen,
        et.reisezeit_minuten,
        et.fabrik_typ,
        COALESCE(se.anzahl, 0) AS anzahl
     FROM einheiten_typen et
     LEFT JOIN spieler_einheiten se
           ON se.einheit_typ_id = et.id AND se.spieler_id = $1
     ORDER BY et.fabrik_typ, et.kaserne_stufe_min, et.id`,
    [spielerId]
  );
  return result.rows;
}

async function upsertSpielerEinheiten(spielerId, einheitTypId, anzahl, client = pool) {
  // Bestand erhöhen oder neu anlegen.
  await client.query(
    `INSERT INTO spieler_einheiten (spieler_id, einheit_typ_id, anzahl)
     VALUES ($1, $2, $3)
     ON CONFLICT (spieler_id, einheit_typ_id)
     DO UPDATE SET anzahl = spieler_einheiten.anzahl + $3`,
    [spielerId, einheitTypId, anzahl]
  );
}

async function findEinheitTypById(id, client = pool) {
  // Einzelnen Einheitentyp für Trainingsprüfungen laden.
  const result = await client.query(
    'SELECT * FROM einheiten_typen WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  findSpielerEinheiten,
  upsertSpielerEinheiten,
  findEinheitTypById,
};
