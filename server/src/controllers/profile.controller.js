const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const events = require('../utils/events');

// Only these fields may be changed through the profile endpoint (mass-assignment protection)
const EDITABLE = ['name', 'headline', 'bio', 'institution', 'department', 'designation', 'location', 'role'];
const LINK_KEYS = ['website', 'googleScholar', 'orcid', 'researchGate', 'linkedin', 'github'];

/** GET /api/profile */
exports.getMyProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPrivateJSON() });
});

/** PUT /api/profile — FR-01 update academic & research information */
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  EDITABLE.forEach((key) => {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  });

  if (req.body.links && typeof req.body.links === 'object') {
    LINK_KEYS.forEach((key) => {
      if (req.body.links[key] !== undefined) user.links[key] = String(req.body.links[key]).trim();
    });
  }
  if (req.body.settings && typeof req.body.settings === 'object') {
    ['showEmail', 'openToCollaborate'].forEach((key) => {
      if (typeof req.body.settings[key] === 'boolean') user.settings[key] = req.body.settings[key];
    });
  }
  if (Array.isArray(req.body.education)) {
    user.education = req.body.education.slice(0, 10).map((e) => ({
      degree: e.degree,
      institution: e.institution,
      field: e.field,
      startYear: e.startYear || undefined,
      endYear: e.endYear || undefined,
    }));
  }

  await user.save();
  events.emit('profile:changed', user._id); // lets other modules (e.g. recommendations) react
  res.json({ success: true, message: 'Profile updated', user: user.toPrivateJSON() });
});

/** PUT /api/profile/avatar — upload / replace profile picture */
exports.uploadAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  user.avatar = {
    data: req.file.buffer,
    contentType: req.file.detectedType,
    size: req.file.size,
    updatedAt: new Date(),
  };
  await user.save();
  res.json({ success: true, message: 'Profile picture updated', avatarUrl: user.avatarUrl, user: user.toPrivateJSON() });
});

/** DELETE /api/profile/avatar */
exports.removeAvatar = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $unset: { avatar: 1 } });
  const user = await User.findById(req.user._id);
  res.json({ success: true, message: 'Profile picture removed', user: user.toPrivateJSON() });
});

/** GET /api/users/:id/avatar — public image stream with HTTP caching */
exports.getAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('+avatar.data +avatar.contentType avatar.updatedAt')
    .lean();
  if (!user || !user.avatar || !user.avatar.data) throw ApiError.notFound('No profile picture');

  const etag = `"${user._id}-${new Date(user.avatar.updatedAt).getTime()}"`;
  res.set({
    'Content-Type': user.avatar.contentType,
    'Cache-Control': 'public, max-age=86400',
    ETag: etag,
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  const data = user.avatar.data.buffer ? Buffer.from(user.avatar.data.buffer) : user.avatar.data;
  return res.send(data);
});
