'use strict';

/*
 * Startdatei:
 * Lädt Konfiguration und startet die in app.js konfigurierte Express-Anwendung.
 */

const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

// Startet den HTTP-Server auf dem konfigurierten Port.
app.listen(config.port, () => {
  console.log(`Server läuft auf http://localhost:${config.port}`);
});
