'use strict';

/*
 * Konfigurationsdatei:
 * Liest Umgebungsvariablen ein, setzt sichere Defaults und exportiert
 * eine zentrale Konfiguration für Server, Session und Datenbank.
 */

const crypto = require('crypto');

// DB_PASSWORD ist in allen Umgebungen verpflichtend – kein unsicherer Fallback-Wert.
if (!process.env.DB_PASSWORD) {
  console.error('FATAL: DB_PASSWORD muss gesetzt sein (z. B. in .env). Keinen Klartextwert als Default nutzen.');
  process.exit(1);
}

// SESSION_SECRET: Falls nicht gesetzt, wird ein zufälliger Wert erzeugt.
// Hinweis: Ein zufälliger Startwert bedeutet, dass Sessions bei einem Neustart ungültig werden.
// In Production sollte SESSION_SECRET dauerhaft in der Umgebung gesetzt sein.
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('WARNUNG: SESSION_SECRET nicht gesetzt – zufälliger Wert für diese Laufzeit erzeugt. Sessions werden bei Neustart ungültig.');
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret,
  db: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'civil_wars',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5433', 10),
  },
  tickDurationSeconds: parseInt(process.env.TICK_DURATION_SECONDS || '30', 10),
};
