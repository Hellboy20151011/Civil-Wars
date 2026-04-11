'use strict';

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
});

router.get('/types', requireLogin, apiLimiter, asyncWrapper(buildingsController.getTypes));

router.post(
  '/build',
  requireLogin,
  apiLimiter,
  validateBody(buildSchema),
  asyncWrapper(buildingsController.build)
);

module.exports = router;
