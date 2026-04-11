'use strict';

/* eslint-disable no-unused-vars */
/**
 * Central Express error-handling middleware.
 * Must be registered last (after all routes) with exactly 4 parameters.
 */
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Interner Serverfehler';
  res.status(status).json({ message });
}

module.exports = { errorHandler };
