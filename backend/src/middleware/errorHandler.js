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
  res.status(status).json({ message });
}

module.exports = { errorHandler };
