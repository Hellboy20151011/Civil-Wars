'use strict';

/*
 * Datenbankmodul:
 * Erstellt einen PostgreSQL-Connection-Pool auf Basis der zentralen Konfiguration.
 */

const { Pool } = require('pg');
const config = require('./config');

// Pool wird in Repositories und Controllern wiederverwendet.
const pool = new Pool(config.db);

module.exports = pool;
