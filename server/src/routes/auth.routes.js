/** FR-01 — Registration & login */
const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const v = require('../validators/auth.validators');
const auth = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/register', authLimiter, validate(v.register), auth.register);
router.post('/auth/login', authLimiter, validate(v.login), auth.login);
router.get('/auth/me', protect, auth.me);
router.patch('/auth/password', protect, authLimiter, validate(v.changePassword), auth.changePassword);

module.exports = router;
