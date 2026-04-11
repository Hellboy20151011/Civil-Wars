'use strict';

const { Router } = require('express');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validate');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name darf nicht leer sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(1, 'Passwort darf nicht leer sein'),
});

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(1, 'Passwort darf nicht leer sein'),
});

router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncWrapper(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncWrapper(authController.login)
);

router.post('/logout', authController.logout);

module.exports = router;
