/** FR-02 — validation for skills, interests, expertise and research domains. */
const { body, param, query } = require('express-validator');

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const TAG_FIELDS = ['interests', 'researchDomains', 'expertise'];

exports.replaceResearch = [
  body(['interests', 'researchDomains', 'expertise', 'skills']).optional().isArray().withMessage('Must be a list'),
  body(['interests.*', 'researchDomains.*', 'expertise.*']).isString().trim().isLength({ min: 1, max: 60 }),
  body('skills.*.name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Skill names must be 1–60 characters'),
  body('skills.*.level').optional().isIn(LEVELS).withMessage('Invalid skill level'),
];

exports.addSkill = [
  body('name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Skill name must be 1–60 characters'),
  body('level').optional().isIn(LEVELS).withMessage('Invalid skill level'),
];

exports.updateSkill = [
  param('skillId').isMongoId().withMessage('Invalid skill id'),
  body('name').optional().isString().trim().isLength({ min: 1, max: 60 }),
  body('level').optional().isIn(LEVELS).withMessage('Invalid skill level'),
];

exports.skillId = [param('skillId').isMongoId().withMessage('Invalid skill id')];

exports.addTag = [
  param('field').isIn(TAG_FIELDS).withMessage('Unknown field'),
  body('value').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Value must be 1–60 characters'),
];

exports.removeTag = [
  param('field').isIn(TAG_FIELDS).withMessage('Unknown field'),
  param('value').isString().isLength({ min: 1, max: 60 }),
];

exports.suggestions = [
  query('field').isIn([...TAG_FIELDS, 'skills']).withMessage('Unknown field'),
  query('q').optional().isString().isLength({ max: 60 }),
];
