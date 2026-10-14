/**
 * FR-02 — Skills & Interest Management
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { uniqueLabels, cleanLabel, normalize, escapeRegex } = require('../utils/text');
const events = require('../utils/events');

const TAG_FIELDS = { interests: 30, researchDomains: 15, expertise: 20 };
const MAX_SKILLS = 40;

const researchPayload = (u) => ({
  skills: u.skills,
  researchDomains: u.researchDomains,
  interests: u.interests,
  expertise: u.expertise,
  profileCompleteness: u.profileCompleteness,
});

const saveAndRespond = async (req, res, message, status = 200) => {
  await req.user.save();
  events.emit('profile:changed', req.user._id); // research data changed
  res.status(status).json({ success: true, message, research: researchPayload(req.user) });
};

/** GET /api/profile/research */
exports.getResearch = asyncHandler(async (req, res) => {
  res.json({ success: true, research: researchPayload(req.user) });
});

/** PUT /api/profile/research — replace all research facets at once */
exports.replaceResearch = asyncHandler(async (req, res) => {
  const user = req.user;
  Object.entries(TAG_FIELDS).forEach(([field, max]) => {
    if (Array.isArray(req.body[field])) {
      const list = uniqueLabels(req.body[field]);
      if (list.length > max) throw ApiError.badRequest(`A maximum of ${max} ${field} is allowed`);
      user[field] = list;
    }
  });
  if (Array.isArray(req.body.skills)) {
    const seen = new Set();
    const skills = [];
    req.body.skills.forEach((s) => {
      const name = cleanLabel(s && s.name);
      if (name && !seen.has(normalize(name))) {
        seen.add(normalize(name));
        skills.push({ name, level: User.SKILL_LEVELS.includes(s.level) ? s.level : 'intermediate' });
      }
    });
    if (skills.length > MAX_SKILLS) throw ApiError.badRequest(`A maximum of ${MAX_SKILLS} skills is allowed`);
    user.skills = skills;
  }
  await saveAndRespond(req, res, 'Research profile saved');
});

/** POST /api/profile/skills */
exports.addSkill = asyncHandler(async (req, res) => {
  const name = cleanLabel(req.body.name);
  const level = req.body.level || 'intermediate';
  if (req.user.skills.some((s) => normalize(s.name) === normalize(name))) {
    throw ApiError.conflict(`"${name}" is already in your skills`);
  }
  if (req.user.skills.length >= MAX_SKILLS) throw ApiError.badRequest(`A maximum of ${MAX_SKILLS} skills is allowed`);
  req.user.skills.push({ name, level });
  await saveAndRespond(req, res, 'Skill added', 201);
});

/** PATCH /api/profile/skills/:skillId */
exports.updateSkill = asyncHandler(async (req, res) => {
  const skill = req.user.skills.id(req.params.skillId);
  if (!skill) throw ApiError.notFound('Skill not found');
  if (req.body.name !== undefined) {
    const name = cleanLabel(req.body.name);
    const clash = req.user.skills.some(
      (s) => String(s._id) !== String(skill._id) && normalize(s.name) === normalize(name)
    );
    if (clash) throw ApiError.conflict(`"${name}" is already in your skills`);
    skill.name = name;
  }
  if (req.body.level !== undefined) skill.level = req.body.level;
  await saveAndRespond(req, res, 'Skill updated');
});

/** DELETE /api/profile/skills/:skillId */
exports.removeSkill = asyncHandler(async (req, res) => {
  const skill = req.user.skills.id(req.params.skillId);
  if (!skill) throw ApiError.notFound('Skill not found');
  skill.deleteOne();
  await saveAndRespond(req, res, 'Skill removed');
});

/** POST /api/profile/tags/:field   body: { value } */
exports.addTag = asyncHandler(async (req, res) => {
  const { field } = req.params;
  const value = cleanLabel(req.body.value);
  const list = req.user[field];
  if (list.some((v) => normalize(v) === normalize(value))) {
    throw ApiError.conflict(`"${value}" is already added`);
  }
  if (list.length >= TAG_FIELDS[field]) throw ApiError.badRequest(`A maximum of ${TAG_FIELDS[field]} items is allowed`);
  list.push(value);
  await saveAndRespond(req, res, 'Added', 201);
});

/** DELETE /api/profile/tags/:field/:value */
exports.removeTag = asyncHandler(async (req, res) => {
  const { field } = req.params;
  const value = normalize(req.params.value);
  const before = req.user[field].length;
  req.user[field] = req.user[field].filter((v) => normalize(v) !== value);
  if (req.user[field].length === before) throw ApiError.notFound('Item not found');
  await saveAndRespond(req, res, 'Removed');
});

// Starter vocabulary so new platforms still have helpful autocomplete
const SEED = {
  researchDomains: [
    'Artificial Intelligence', 'Machine Learning', 'Natural Language Processing', 'Computer Vision',
    'Data Science', 'Software Engineering', 'Cybersecurity', 'Human-Computer Interaction',
    'Internet of Things', 'Bioinformatics', 'Cloud Computing', 'Blockchain', 'Robotics',
    'Health Informatics', 'Educational Technology', 'Computer Networks', 'Quantum Computing',
  ],
  skills: [
    'Python', 'JavaScript', 'React', 'Node.js', 'TensorFlow', 'PyTorch', 'MATLAB', 'R', 'SQL',
    'MongoDB', 'Statistical Analysis', 'Data Visualization', 'Scientific Writing', 'LaTeX',
    'Deep Learning', 'Research Methodology', 'Survey Design', 'Java', 'C++', 'Docker',
  ],
  interests: [
    'Explainable AI', 'Large Language Models', 'Federated Learning', 'Medical Imaging',
    'Smart Agriculture', 'Sustainable Computing', 'Bangla NLP', 'Fake News Detection',
    'Recommender Systems', 'Edge Computing', 'Software Testing', 'Climate Informatics',
  ],
  expertise: [
    'Literature Review', 'Experimental Design', 'Qualitative Research', 'Quantitative Research',
    'Grant Writing', 'Peer Review', 'Dataset Curation', 'Model Evaluation', 'Systematic Review',
  ],
};

/** GET /api/taxonomy/suggestions?field=skills&q=py — autocomplete from real usage + seed list */
exports.suggestions = asyncHandler(async (req, res) => {
  const field = req.query.field;
  const q = normalize(req.query.q || '');
  const path = field === 'skills' ? '$skills.name' : `$${field}`;
  const unwind = field === 'skills' ? '$skills' : `$${field}`;

  const pipeline = [{ $match: { isActive: true } }, { $unwind: unwind }];
  if (q) pipeline.push({ $match: { [field === 'skills' ? 'skills.name' : field]: { $regex: escapeRegex(q), $options: 'i' } } });
  pipeline.push(
    { $group: { _id: { $toLower: path }, label: { $first: path }, count: { $sum: 1 } } },
    { $sort: { count: -1, label: 1 } },
    { $limit: 15 }
  );

  const used = await User.aggregate(pipeline);
  const seen = new Set(used.map((u) => u._id));
  const seed = SEED[field]
    .filter((s) => (!q || normalize(s).includes(q)) && !seen.has(normalize(s)))
    .map((label) => ({ label, count: 0 }));

  res.json({
    success: true,
    suggestions: [...used.map((u) => ({ label: u.label, count: u.count })), ...seed].slice(0, 15),
  });
});
