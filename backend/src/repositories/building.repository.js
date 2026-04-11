'use strict';

const pool = require('../../db');

async function findAllTypes(client = pool) {
  const result = await client.query('SELECT * FROM gebaeude_typen ORDER BY id');
  return result.rows;
}

async function findTypById(id, client = pool) {
  const result = await client.query(
    'SELECT * FROM gebaeude_typen WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function findHauptgebaeude(client = pool) {
  const result = await client.query(
    "SELECT id FROM gebaeude_typen WHERE name = 'Hauptgebäude' LIMIT 1"
  );
  return result.rows[0] || null;
}

async function findBySpieler(spielerId, client = pool) {
  const result = await client.query(
    `SELECT
        gt.id,
        gt.name,
        gt.kategorie,
        sg.anzahl,
        gt.kosten_geld,
        gt.kosten_stein,
        gt.kosten_eisen,
        gt.kosten_treibstoff,
        gt.einkommen_geld,
        gt.produktion_stein,
        gt.produktion_eisen,
        gt.produktion_treibstoff,
        gt.strom_produktion,
        gt.strom_verbrauch,
        gt.bewohner
     FROM spieler_gebaeude sg
     JOIN gebaeude_typen gt ON gt.id = sg.gebaeude_typ_id
     WHERE sg.spieler_id = $1
     ORDER BY gt.id`,
    [spielerId]
  );
  return result.rows;
}

async function upsertSpielerGebaeude(spielerId, gebaeudeTypId, client = pool) {
  await client.query(
    `INSERT INTO spieler_gebaeude (spieler_id, gebaeude_typ_id, anzahl)
     VALUES ($1, $2, 1)
     ON CONFLICT (spieler_id, gebaeude_typ_id)
     DO UPDATE SET anzahl = spieler_gebaeude.anzahl + 1`,
    [spielerId, gebaeudeTypId]
  );
}

module.exports = {
  findAllTypes,
  findTypById,
  findHauptgebaeude,
  findBySpieler,
  upsertSpielerGebaeude,
};
