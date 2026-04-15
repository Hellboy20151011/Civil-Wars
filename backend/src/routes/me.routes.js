'use strict';

/*
 * Me-Router:
 * Liefert den aggregierten Spielerstatus für das Frontend-Dashboard.
 * Verknüpfung: Route -> me.controller -> player.service -> economy/building/player repositories.
 */

const { Router } = require('express');
const meController = require('../controllers/me.controller');
const { requireLogin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

// GET /api/me -> meController.me -> gibt Ressourcen, Gebäude, Tick-Infos und Aufträge zurück.
router.get('/', requireLogin, apiLimiter, asyncWrapper(meController.me));

module.exports = router;
