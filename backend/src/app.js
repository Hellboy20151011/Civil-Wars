'use strict';

/*
 * Dateiübersicht:
 * Diese Datei erstellt die zentrale Express-App und verbindet Middleware,
 * Session-Handling, statische Frontend-Dateien und alle API-Router.
 */

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const pool = require('./db');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');
const buildingsRoutes = require('./routes/buildings.routes');
const militaryRoutes = require('./routes/military.routes');
const weltkarteRoutes = require('./routes/weltkarte.routes');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // Liest JSON- und Formular-Body-Daten aus eingehenden HTTP-Requests.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Persistente Session-Speicherung in PostgreSQL (Tabelle: user_sessions).
  app.use(
    session({
      store: new pgSession({
        pool,
        tableName: 'user_sessions',
      }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'strict',
        secure: config.nodeEnv === 'production',
      },
    })
  );

  // Stellt das Frontend aus dem /public-Ordner bereit.
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  // Route -> Router-Verknüpfung:
  // /api/* ruft Auth-Routen auf (auth.routes -> auth.controller -> Repositories/DB)
  app.use('/api', authRoutes);
  // /api/me ruft den Status-Endpunkt auf (me.routes -> me.controller -> player.service)
  app.use('/api/me', meRoutes);
  // /api/buildings ruft Bau-Endpunkte auf (buildings.routes -> buildings.controller -> services/repos)
  app.use('/api/buildings', buildingsRoutes);
  // /api/military ruft Militär-Endpunkte auf (military.routes -> military.controller -> services/repos)
  app.use('/api/military', militaryRoutes);
  // /api/weltkarte ruft Weltkarten-Endpunkte auf (weltkarte.routes -> weltkarte.controller -> player.repository)
  app.use('/api/weltkarte', weltkarteRoutes);

  // Zentraler Fehler-Handler muss zuletzt registriert werden.
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
