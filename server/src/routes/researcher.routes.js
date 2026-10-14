/** FR-03 — Researcher Search & Discovery */
const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { objectId } = require('../validators/common.validators');
const researchers = require('../controllers/researcher.controller');

const router = express.Router();

router.get('/researchers', protect, researchers.search);
router.get('/researchers/filters', protect, researchers.filters);
router.get('/researchers/:id', protect, validate(objectId), researchers.getById);

module.exports = router;
