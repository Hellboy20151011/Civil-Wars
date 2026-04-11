'use strict';

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const pool = require('./db');
const config = require('./config');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');
const buildingsRoutes = require('./routes/buildings.routes');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  /* API routes */
  app.use('/api', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/buildings', buildingsRoutes);

  /* Central error handler – must be last */
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
