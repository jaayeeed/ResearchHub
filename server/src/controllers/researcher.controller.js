/**
 * FR-03 — Researcher Search & Discovery
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalize, escapeRegex } = require('../utils/text');

const CARD_FIELDS =
  'name role headline institution department designation avatar.updatedAt researchDomains skills interests expertise settings createdAt';

const csv = (v) =>
  String(v || '')
    .split(',')
    .map(normalize)
    .filter(Boolean)
    .slice(0, 10);

/**
 * GET /api/researchers
 * Query: q, domain, skill, interest, institution, role, sort=relevance|name|newest, page, limit
 * domain/skill/interest accept comma separated values (match ANY).
 */
exports.search = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const { q = '', role, institution, sort = 'relevance' } = req.query;

  const filter = { isActive: true, _id: { $ne: req.user._id } };
  const domains = csv(req.query.domain);
  const skills = csv(req.query.skill);
  const interests = csv(req.query.interest);
  if (domains.length) filter['norm.researchDomains'] = { $in: domains };
  if (skills.length) filter['norm.skills'] = { $in: skills };
  if (interests.length) filter['norm.interests'] = { $in: interests };
  if (role && User.ROLES.includes(role)) filter.role = role;
  if (institution) filter.institution = { $regex: escapeRegex(institution.slice(0, 80)), $options: 'i' };

  const term = String(q).trim().slice(0, 80);
  if (term) {
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    filter.$or = [
      { name: rx },
      { headline: rx },
      { institution: rx },
      { department: rx },
      { researchDomains: rx },
      { interests: rx },
      { expertise: rx },
      { 'skills.name': rx },
    ];
  }

  const sortSpec = sort === 'name' ? { name: 1 } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    User.find(filter)
      .select(CARD_FIELDS)
      .sort(sortSpec)
      // relevance ranking happens in memory for the result window, so fetch a bounded set
      .skip(sort === 'relevance' && term ? 0 : (page - 1) * limit)
      .limit(sort === 'relevance' && term ? 500 : limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  let results = docs;
  if (sort === 'relevance' && term) {
    const t = normalize(term);
    const rank = (u) => {
      let s = 0;
      if (normalize(u.name) === t) s += 10;
      if (normalize(u.name).includes(t)) s += 5;
      if ((u.researchDomains || []).some((d) => normalize(d).includes(t))) s += 4;
      if ((u.skills || []).some((k) => normalize(k.name).includes(t))) s += 3;
      if ((u.interests || []).some((i) => normalize(i).includes(t))) s += 3;
      if ((u.expertise || []).some((e) => normalize(e).includes(t))) s += 2;
      if (normalize(u.institution).includes(t)) s += 2;
      if (normalize(u.headline).includes(t)) s += 1;
      return s;
    };
    results = docs
      .map((u) => ({ u, s: rank(u) }))
      .sort((a, b) => b.s - a.s || a.u.name.localeCompare(b.u.name))
      .slice((page - 1) * limit, page * limit)
      .map((x) => x.u);
  }

  res.json({
    success: true,
    items: results.map(User.toCard),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/** GET /api/researchers/filters — facet values with counts for the filter sidebar */
exports.filters = asyncHandler(async (req, res) => {
  const top = (unwindPath, labelPath, n = 12) => [
    { $unwind: unwindPath },
    { $group: { _id: { $toLower: labelPath }, label: { $first: labelPath }, count: { $sum: 1 } } },
    { $sort: { count: -1, label: 1 } },
    { $limit: n },
    { $project: { _id: 0, label: 1, count: 1 } },
  ];

  const [facets] = await User.aggregate([
    { $match: { isActive: true } },
    {
      $facet: {
        domains: top('$researchDomains', '$researchDomains'),
        skills: top('$skills', '$skills.name'),
        interests: top('$interests', '$interests'),
        institutions: [
          { $match: { institution: { $ne: '' } } },
          { $group: { _id: { $toLower: '$institution' }, label: { $first: '$institution' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, label: 1, count: 1 } },
        ],
        roles: [{ $group: { _id: '$role', count: { $sum: 1 } } }, { $project: { _id: 0, label: '$_id', count: 1 } }],
        total: [{ $count: 'value' }],
      },
    },
  ]);

  res.json({
    success: true,
    filters: { ...facets, total: facets.total[0] ? facets.total[0].value : 0 },
  });
});

/** GET /api/researchers/:id — public profile */
exports.getById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound('Researcher not found');
  const user = await User.findOne({ _id: req.params.id, isActive: true });
  if (!user) throw ApiError.notFound('Researcher not found');

  const isMe = String(user._id) === String(req.user._id);
  res.json({
    success: true,
    isMe,
    // other people never see your private fields (email only if they allow it)
    researcher: isMe ? user.toPrivateJSON() : user.toPublicJSON(),
  });
});
