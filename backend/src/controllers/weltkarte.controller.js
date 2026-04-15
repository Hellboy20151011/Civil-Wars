'use strict';

/*
 * Weltkarten-Controller:
 * Liefert die Datenbasis für die Frontend-Karte (alle Spieler + Koordinaten).
 */

const playerRepo = require('../repositories/player.repository');

// GET /api/weltkarte -> nutzt player.repository.findAll für die Kartenansicht im Frontend.
async function getWeltkarte(req, res) {
  const spieler = await playerRepo.findAll();
  res.json(spieler);
}

module.exports = { getWeltkarte };
