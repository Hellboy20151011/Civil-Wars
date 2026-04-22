'use strict';

/*
 * Weltkarten-Controller:
 * Liefert die Datenbasis für die Frontend-Karte (Spieler + Koordinaten).
 * Unterstützt seitenweises Laden über Query-Parameter `limit` und `offset`.
 */

const playerRepo = require('../repositories/player.repository');

const MAX_LIMIT = 200;

// GET /api/weltkarte -> nutzt player.repository.findAll mit Paging für die Kartenansicht.
async function getWeltkarte(req, res) {
  // Limit und Offset aus Query-Parametern lesen; Standardwerte und Obergrenzen sicherstellen.
  const limit  = Math.min(parseInt(req.query.limit  || '200', 10), MAX_LIMIT);
  const offset = Math.max(parseInt(req.query.offset || '0',   10), 0);

  const spieler = await playerRepo.findAll(limit, offset);
  res.json(spieler);
}

module.exports = { getWeltkarte };
