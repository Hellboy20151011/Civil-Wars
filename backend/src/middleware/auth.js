'use strict';

function requireLogin(req, res, next) {
  if (!req.session.spieler) {
    return res.status(401).json({ message: 'Nicht eingeloggt' });
  }
  next();
}

module.exports = { requireLogin };
