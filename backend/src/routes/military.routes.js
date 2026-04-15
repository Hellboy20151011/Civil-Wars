'use strict';

/*
 * Military-Router:
 * Definiert Endpunkte für Militärstatus, Kaserne-Upgrade und Einheitenausbildung.
 * Verknüpfung: Route -> military.controller -> economy/player services + building/resources/einheiten repositories.
 */

const { Router } = require('express');
const { z } = require('zod');
const militaryController = require('../controllers/military.controller');
const { requireLogin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { validateBody } = require('../middleware/validate');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

const trainSchema = z.object({
  einheitTypId: z.coerce.number().int().positive('einheitTypId muss eine positive Ganzzahl sein'),
  anzahl: z.coerce.number().int().min(1, 'anzahl muss mindestens 1 sein').default(1),
});

// GET /api/military/status -> getStatus -> liefert Kaserne, Fabrikzugriff, Einheiten und Ressourcen.
router.get('/status', requireLogin, apiLimiter, asyncWrapper(militaryController.getStatus));
// POST /api/military/upgrade -> upgradeKaserne -> prüft Kosten und erhöht Kaserne-Stufe.
router.post('/upgrade', requireLogin, apiLimiter, asyncWrapper(militaryController.upgradeKaserne));
// POST /api/military/train -> trainEinheit -> validiert Eingabe und bucht Ressourcen/Einheiten.
router.post(
  '/train',
  requireLogin,
  apiLimiter,
  validateBody(trainSchema),
  asyncWrapper(militaryController.trainEinheit)
);

module.exports = router;
