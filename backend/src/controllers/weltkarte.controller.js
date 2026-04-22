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
  // Limit und Offset aus Query-Parametern lesen; ungültige Werte werden durch sichere Defaults ersetzt.
  const parsedLimit  = parseInt(req.query.limit  || '', 10);
  const parsedOffset = parseInt(req.query.offset || '', 10);

  const limit  = Math.min(Number.isFinite(parsedLimit)  ? parsedLimit  : MAX_LIMIT, MAX_LIMIT);
  const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;

  const spieler = await playerRepo.findAll(limit, offset);
  res.json(spieler);
}

module.exports = { getWeltkarte };
