/** FR-02 — Skills & Interest Management */
const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/research.validators');
const research = require('../controllers/research.controller');

const router = express.Router();

router.get('/profile/research', protect, research.getResearch);
router.put('/profile/research', protect, validate(v.replaceResearch), research.replaceResearch);
router.post('/profile/skills', protect, validate(v.addSkill), research.addSkill);
router.patch('/profile/skills/:skillId', protect, validate(v.updateSkill), research.updateSkill);
router.delete('/profile/skills/:skillId', protect, validate(v.skillId), research.removeSkill);
router.post('/profile/tags/:field', protect, validate(v.addTag), research.addTag);
router.delete('/profile/tags/:field/:value', protect, validate(v.removeTag), research.removeTag);
router.get('/taxonomy/suggestions', protect, validate(v.suggestions), research.suggestions);

module.exports = router;
