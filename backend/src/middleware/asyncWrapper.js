'use strict';

/*
 * Middleware-Helfer:
 * Verpackt async-Controller, damit Fehler automatisch an den zentralen
 * Express-Fehler-Handler weitergereicht werden.
 */

/**
 * Gibt einen Express-Handler zurück, der Promise-Rejections per next(err) weiterleitet.
 */
function asyncWrapper(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncWrapper };
