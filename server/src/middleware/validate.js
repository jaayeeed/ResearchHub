const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Runs express-validator chains and returns a 400 with field errors. */
const validate = (chains) => async (req, res, next) => {
  await Promise.all(chains.map((c) => c.run(req)));
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest(details[0].message, details));
};

module.exports = validate;
