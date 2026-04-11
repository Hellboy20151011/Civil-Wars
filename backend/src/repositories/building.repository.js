'use strict';

const pool = require('../db');

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
        sg.stufe,
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

async function findSpielerGebaeudeAnzahlByName(spielerId, name, client = pool) {
  const result = await client.query(
    `SELECT sg.anzahl
     FROM spieler_gebaeude sg
     JOIN gebaeude_typen gt ON gt.id = sg.gebaeude_typ_id
     WHERE sg.spieler_id = $1 AND gt.name = $2`,
    [spielerId, name]
  );
  return result.rows[0] ? Number(result.rows[0].anzahl) : 0;
}

async function findKaserneStufe(spielerId, client = pool) {
  const result = await client.query(
    `SELECT sg.stufe
     FROM spieler_gebaeude sg
     JOIN gebaeude_typen gt ON gt.id = sg.gebaeude_typ_id
     WHERE sg.spieler_id = $1 AND gt.name = 'Kaserne'`,
    [spielerId]
  );
  return result.rows[0] ? Number(result.rows[0].stufe) : 0;
}

async function upgradeKaserneStufe(spielerId, client = pool) {
  await client.query(
    `UPDATE spieler_gebaeude sg
     SET stufe = sg.stufe + 1
     FROM gebaeude_typen gt
     WHERE sg.gebaeude_typ_id = gt.id
       AND sg.spieler_id = $1
       AND gt.name = 'Kaserne'`,
    [spielerId]
  );
}

async function upsertSpielerGebaeude(spielerId, gebaeudeTypId, anzahl = 1, client = pool) {
  await client.query(
    `INSERT INTO spieler_gebaeude (spieler_id, gebaeude_typ_id, anzahl)
     VALUES ($1, $2, $3)
     ON CONFLICT (spieler_id, gebaeude_typ_id)
     DO UPDATE SET anzahl = spieler_gebaeude.anzahl + $3`,
    [spielerId, gebaeudeTypId, anzahl]
  );
}

async function findKaserneStufen(client = pool) {
  const result = await client.query('SELECT * FROM kaserne_stufen ORDER BY stufe');
  return result.rows;
}

async function findKaserneStufenById(stufe, client = pool) {
  const result = await client.query(
    'SELECT * FROM kaserne_stufen WHERE stufe = $1',
    [stufe]
  );
  return result.rows[0] || null;
}

async function createBauauftrag(spielerId, gebaeudeTypId, anzahl, bauzeit_minuten, client = pool) {
  const result = await client.query(
    `INSERT INTO bau_auftraege (spieler_id, gebaeude_typ_id, anzahl, fertig_am)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::INTERVAL)
     RETURNING *`,
    [spielerId, gebaeudeTypId, anzahl, bauzeit_minuten]
  );
  return result.rows[0];
}

async function findBauauftraegeBySpielerId(spielerId, client = pool) {
  const result = await client.query(
    `SELECT ba.id, ba.spieler_id, ba.gebaeude_typ_id, ba.anzahl,
            ba.begonnen_am, ba.fertig_am, gt.name AS gebaeude_name
     FROM bau_auftraege ba
     JOIN gebaeude_typen gt ON gt.id = ba.gebaeude_typ_id
     WHERE ba.spieler_id = $1
     ORDER BY ba.fertig_am`,
    [spielerId]
  );
  return result.rows;
}

async function findFertigeBauauftraege(spielerId, client = pool) {
  const result = await client.query(
    `SELECT ba.id, ba.spieler_id, ba.gebaeude_typ_id, ba.anzahl
     FROM bau_auftraege ba
     WHERE ba.spieler_id = $1 AND ba.fertig_am <= NOW()
     ORDER BY ba.fertig_am`,
    [spielerId]
  );
  return result.rows;
}

async function findExistingBauauftrag(spielerId, gebaeudeTypId, client = pool) {
  const result = await client.query(
    `SELECT id FROM bau_auftraege
     WHERE spieler_id = $1 AND gebaeude_typ_id = $2 AND fertig_am > NOW()
     LIMIT 1`,
    [spielerId, gebaeudeTypId]
  );
  return result.rows[0] || null;
}

async function deleteBauauftrag(id, client = pool) {
  await client.query('DELETE FROM bau_auftraege WHERE id = $1', [id]);
}

module.exports = {
  findAllTypes,
  findTypById,
  findHauptgebaeude,
  findBySpieler,
  findSpielerGebaeudeAnzahlByName,
  findKaserneStufe,
  upgradeKaserneStufe,
  upsertSpielerGebaeude,
  findKaserneStufen,
  findKaserneStufenById,
  createBauauftrag,
  findBauauftraegeBySpielerId,
  findFertigeBauauftraege,
  findExistingBauauftrag,
  deleteBauauftrag,
};
