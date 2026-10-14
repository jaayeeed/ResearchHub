/**
 * FR-04 — Recommendation System (HTTP layer).
 * The matching algorithm itself lives in services/recommendation.service.js
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const recommendations = require('../services/recommendation.service');

/** GET /api/recommendations?page=&limit=&role=&minScore= */
exports.recommend = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const minScore = Math.min(100, Math.max(0, parseInt(req.query.minScore, 10) || 5));
  const role = User.ROLES.includes(req.query.role) ? req.query.role : undefined;

  const result = await recommendations.recommendFor(req.user, { page, limit, minScore, role });
  res.json({ success: true, weights: recommendations.WEIGHTS, ...result });
});

/** GET /api/researchers/:id/match — how well this researcher matches the viewer */
exports.match = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) return res.json({ success: true, match: null });
  const other = await User.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!other) throw ApiError.notFound('Researcher not found');
  const match = recommendations.scoreCandidate(recommendations.fingerprint(req.user), other);
  return res.json({ success: true, match });
});

/** GET /api/researchers/:id/similar — "researchers like this one" */
exports.similar = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Researcher not found');
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('Researcher not found');
  const result = await recommendations.recommendFor(target, { limit: 6 });
  // never suggest the viewer to themselves
  const items = result.items.filter((r) => String(r.researcher.id) !== String(req.user._id)).slice(0, 5);
  res.json({ success: true, items });
});

/** GET /api/stats/overview — numbers for the dashboard */
exports.overview = asyncHandler(async (req, res) => {
  const [researchers, institutions, recs] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.distinct('norm.institution', { isActive: true, 'norm.institution': { $ne: '' } }),
    recommendations.recommendFor(req.user, { limit: 4 }),
  ]);
  res.json({
    success: true,
    stats: {
      researchers,
      institutions: institutions.length,
      matches: recs.total,
      profileCompleteness: req.user.profileCompleteness,
    },
    topMatches: recs.items,
  });
});
