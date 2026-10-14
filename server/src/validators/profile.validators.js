/** FR-01 — validation for profile updates. */
const { body } = require('express-validator');
const { ROLES } = require('./common.validators');

const optionalUrl = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Links must be valid URLs starting with http:// or https://');

exports.updateProfile = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('headline').optional().trim().isLength({ max: 140 }).withMessage('Headline is limited to 140 characters'),
  body('bio').optional().trim().isLength({ max: 1500 }).withMessage('Bio is limited to 1500 characters'),
  body(['institution', 'department']).optional().trim().isLength({ max: 120 }),
  body(['designation', 'location']).optional().trim().isLength({ max: 80 }),
  body('role').optional().isIn(ROLES).withMessage('Invalid role'),
  optionalUrl('links.website'),
  optionalUrl('links.googleScholar'),
  optionalUrl('links.researchGate'),
  optionalUrl('links.linkedin'),
  optionalUrl('links.github'),
  body('links.orcid')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/)
    .withMessage('ORCID must look like 0000-0002-1825-0097'),
  body('education').optional().isArray({ max: 10 }).withMessage('Up to 10 education entries'),
  body('education.*.degree').trim().notEmpty().withMessage('Degree is required').isLength({ max: 100 }),
  body('education.*.institution').trim().notEmpty().withMessage('Education institution is required').isLength({ max: 120 }),
  body('education.*.startYear').optional({ values: 'falsy' }).isInt({ min: 1950, max: 2100 }).toInt(),
  body('education.*.endYear').optional({ values: 'falsy' }).isInt({ min: 1950, max: 2100 }).toInt(),
  body('settings.showEmail').optional().isBoolean(),
  body('settings.openToCollaborate').optional().isBoolean(),
];
