'use strict';

/*
 * Weltkarten-Router:
 * Stellt den Endpunkt für alle Spielerkoordinaten bereit.
 * Verknüpfung: Route -> weltkarte.controller -> player.repository -> PostgreSQL.
 */

const { Router } = require('express');
const weltkarteController = require('../controllers/weltkarte.controller');
const { requireLogin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

// GET /api/weltkarte -> getWeltkarte -> liefert alle Spieler mit X/Y-Koordinaten.
router.get('/', requireLogin, apiLimiter, asyncWrapper(weltkarteController.getWeltkarte));

module.exports = router;
