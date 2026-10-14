/** FR-01 — validation for registration, login and password change. */
const { body } = require('express-validator');
const { ROLES } = require('./common.validators');

// Password policy (Security NFR): 8+ chars with upper, lower and a number
const strongPassword = (field) =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number');

exports.register = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  strongPassword('password'),
  body('role').optional().isIn(ROLES).withMessage('Invalid role'),
  body('institution').optional().trim().isLength({ max: 120 }),
  body('department').optional().trim().isLength({ max: 120 }),
];

exports.login = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

exports.changePassword = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  strongPassword('newPassword'),
];
