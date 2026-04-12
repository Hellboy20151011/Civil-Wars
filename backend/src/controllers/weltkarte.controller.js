'use strict';

const playerRepo = require('../repositories/player.repository');

/* GET /api/weltkarte
   Gibt alle Spieler mit ihren Koordinaten zurück.
   Wird von der Weltkarte-Seite genutzt, um alle Spieler auf der Karte anzuzeigen. */
async function getWeltkarte(req, res) {
  const spieler = await playerRepo.findAll();
  res.json(spieler);
}

module.exports = { getWeltkarte };
