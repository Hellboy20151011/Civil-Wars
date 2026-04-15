'use strict';

/*
 * Auth-Router:
 * Definiert Login/Registrierung/Logout-Endpunkte.
 * Verknüpfung: Route -> auth.controller -> Repositories (player/building/resources) -> PostgreSQL.
 */

const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiters');
const { validateBody } = require('../middleware/validate');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, 'Name darf nicht leer sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
});

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  passwort: z.string().min(1, 'Passwort darf nicht leer sein'),
});

// POST /api/register -> authController.register -> legt Spieler, Start-Ressourcen und Startgebäude an.
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncWrapper(authController.register)
);

// POST /api/login -> authController.login -> prüft Zugangsdaten und setzt Session.
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncWrapper(authController.login)
);

// POST /api/logout -> authController.logout -> zerstört Session und entfernt Session-Cookie.
router.post('/logout', authController.logout);

module.exports = router;
