'use strict';

/*
 * Auth-Middleware:
 * Prüft, ob in der Session ein eingeloggter Spieler hinterlegt ist.
 */

function requireLogin(req, res, next) {
  // Ohne Session-Spieler wird der Zugriff auf geschützte API-Endpunkte blockiert.
  if (!req.session.spieler) {
    return res.status(401).json({ message: 'Nicht eingeloggt' });
  }
  next();
}

module.exports = { requireLogin };
