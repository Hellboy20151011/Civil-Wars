'use strict';

/*
 * Me-Controller:
 * Liefert den vollständigen Spielerstatus für Dashboard und Bauzentrum.
 * Die Berechnung wird an player.service delegiert.
 */

const pool = require('../db');
const playerService = require('../services/player.service');

async function me(req, res) {
  const client = await pool.connect();
  try {
    // Transaktion schützt vor inkonsistentem Zwischenstand bei Tick- und Auftragsverarbeitung.
    await client.query('BEGIN');
    const status = await playerService.getSpielerStatus(req.session.spieler.id, client);
    await client.query('COMMIT');
    res.json(status);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { me };
