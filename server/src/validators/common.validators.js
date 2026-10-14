/** Validation rules shared by several features. */
const { param } = require('express-validator');

const ROLES = ['student', 'thesis_student', 'researcher', 'professor'];

exports.ROLES = ROLES;
exports.objectId = [param('id').isMongoId().withMessage('Invalid id')];
