/**
 * Mounts every feature's routes under /api.
 * Each functional requirement owns its own route file.
 */
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// ---- Health (Reliability NFR: used by Render health checks) ----
router.get('/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  res.status(dbState === 'connected' ? 200 : 503).json({ status: 'ok', db: dbState, uptime: process.uptime() });
});

router.use(require('./auth.routes')); // FR-01 registration & login
router.use(require('./profile.routes')); // FR-01 profile & profile picture
router.use(require('./research.routes')); // FR-02 skills & interests

module.exports = router;
