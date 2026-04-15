'use strict';

/*
 * Buildings-Router:
 * Definiert Endpunkte für Gebäudetypen, Bauwarteschlange und Bauaufträge.
 * Verknüpfung: Route -> buildings.controller -> economy/player services + repositories -> PostgreSQL.
 */

const { Router } = require('express');
const { z } = require('zod');
const buildingsController = require('../controllers/buildings.controller');
const { requireLogin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiters');
const { validateBody } = require('../middleware/validate');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

const buildSchema = z.object({
  gebaeudeTypId: z.coerce.number().int().positive('gebaeudeTypId muss eine positive Ganzzahl sein'),
  anzahl: z.coerce.number().int().min(1, 'anzahl muss mindestens 1 sein').default(1),
});

// GET /api/buildings/types -> getTypes -> liest verfügbare Gebäudetypen aus building.repository.
router.get('/types', requireLogin, apiLimiter, asyncWrapper(buildingsController.getTypes));

// GET /api/buildings/queue -> getQueue -> verarbeitet fertige Aufträge und liefert Warteschlange.
router.get('/queue', requireLogin, apiLimiter, asyncWrapper(buildingsController.getQueue));

// POST /api/buildings/build -> build -> validiert Anfrage, verrechnet Ressourcen und erstellt Auftrag/sofortigen Bau.
router.post(
  '/build',
  requireLogin,
  apiLimiter,
  validateBody(buildSchema),
  asyncWrapper(buildingsController.build)
);

module.exports = router;
