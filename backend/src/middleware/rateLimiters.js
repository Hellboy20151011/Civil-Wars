'use strict';

/*
 * Rate-Limiter:
 * Definiert Schutzregeln gegen zu viele Anfragen (Auth strenger, API allgemeiner).
 */

const rateLimit = require('express-rate-limit');

// Schutz für Login/Registrierung gegen Brute-Force-Versuche.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
});

// Allgemeiner Schutz für häufig aufgerufene API-Endpunkte.
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
});

module.exports = { authLimiter, apiLimiter };
