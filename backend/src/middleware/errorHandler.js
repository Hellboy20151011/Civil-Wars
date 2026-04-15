'use strict';

/* eslint-disable no-unused-vars */
/*
 * Fehler-Middleware:
 * Einheitlicher API-Fehlerausgangspunkt für alle Controller und Middleware.
 */

/**
 * Zentraler Express-Fehler-Handler.
 * Muss als letzte Middleware mit vier Parametern registriert werden.
 */
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Interner Serverfehler';
  const payload = { message };
  if (res.locals && res.locals.serverNow) {
    payload.serverNow = res.locals.serverNow;
  } else if (req.originalUrl && req.originalUrl.startsWith('/api/me')) {
    payload.serverNow = new Date().toISOString();
  }
  res.status(status).json(payload);
}

module.exports = { errorHandler };
