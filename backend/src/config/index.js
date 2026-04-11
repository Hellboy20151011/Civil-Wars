'use strict';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET muss in Production gesetzt sein (NODE_ENV=production).');
  process.exit(1);
}

if (isProduction && !process.env.DB_PASSWORD) {
  console.error('FATAL: DB_PASSWORD muss in Production gesetzt sein (NODE_ENV=production).');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'civil-wars-super-secret',
  db: {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'civil_wars',
    password: process.env.DB_PASSWORD || 'admin',
    port: parseInt(process.env.DB_PORT || '5433', 10),
  },
  tickDurationSeconds: parseInt(process.env.TICK_DURATION_SECONDS || '30', 10),
};
