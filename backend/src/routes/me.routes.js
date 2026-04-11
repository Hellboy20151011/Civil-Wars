'use strict';

const { Router } = require('express');
const meController = require('../controllers/me.controller');
const { requireLogin } = require('../middleware/auth');
const { asyncWrapper } = require('../middleware/asyncWrapper');

const router = Router();

router.get('/', requireLogin, asyncWrapper(meController.me));

module.exports = router;
