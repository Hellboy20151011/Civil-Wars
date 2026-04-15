'use strict';

/*
 * Auth-Middleware:
 * Prüft, ob in der Session ein eingeloggter Spieler hinterlegt ist.
 */

function requireLogin(req, res, next) {
  // Ohne Session-Spieler wird der Zugriff auf geschützte API-Endpunkte blockiert.
  if (!req.session.spieler) {
    if (req.originalUrl && req.originalUrl.startsWith('/api/me')) {
      return res.status(401).json({ message: 'Nicht eingeloggt', serverNow: new Date().toISOString() });
    }
    return res.status(401).json({ message: 'Nicht eingeloggt' });
  }
  next();
}

module.exports = { requireLogin };
