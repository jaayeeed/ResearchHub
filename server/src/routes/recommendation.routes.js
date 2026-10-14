/** FR-04 — Recommendation System */
const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId } = require('../validators/common.validators');
const rec = require('../controllers/recommendation.controller');

const router = express.Router();

router.get('/recommendations', protect, rec.recommend);
router.get('/researchers/:id/match', protect, validate(objectId), rec.match);
router.get('/researchers/:id/similar', protect, validate(objectId), rec.similar);
router.get('/stats/overview', protect, rec.overview);

module.exports = router;
