/** FR-01 — Academic profile & profile picture */
const express = require('express');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { handleAvatarUpload } = require('../middleware/upload');
const v = require('../validators/profile.validators');
const { objectId } = require('../validators/common.validators');
const profile = require('../controllers/profile.controller');

const router = express.Router();

router.get('/profile', protect, profile.getMyProfile);
router.put('/profile', protect, validate(v.updateProfile), profile.updateMyProfile);
router.put('/profile/avatar', protect, handleAvatarUpload, profile.uploadAvatar);
router.delete('/profile/avatar', protect, profile.removeAvatar);
router.get('/users/:id/avatar', validate(objectId), profile.getAvatar);

module.exports = router;
