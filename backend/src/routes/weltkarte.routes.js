'use strict';

const { Router } = require('express');
const weltkarteController = require('../controllers/weltkarte.controller');
const { requireLogin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

/* Alle Spielerkoordinaten abrufen – nur für eingeloggte Spieler */
router.get('/', requireLogin, apiLimiter, asyncWrapper(weltkarteController.getWeltkarte));

module.exports = router;
