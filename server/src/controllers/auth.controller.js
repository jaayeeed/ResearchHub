const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

const sendAuth = (res, user, status = 200) =>
  res.status(status).json({ success: true, token: signToken(user._id), user: user.toPrivateJSON() });

/** POST /api/auth/register — FR-01 */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, institution, department } = req.body;
  const exists = await User.exists({ email: String(email).toLowerCase() });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, role, institution, department });
  sendAuth(res, user, 201);
});

/** POST /api/auth/login — FR-01 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // Same message for unknown email & wrong password (prevents account enumeration)
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');

  user.lastLoginAt = new Date();
  await user.save({ validateModifiedOnly: true });
  sendAuth(res, user);
});

/** GET /api/auth/me */
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPrivateJSON() });
});

/** PATCH /api/auth/password */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from the current one');
  }
  user.password = newPassword;
  await user.save();
  sendAuth(res, user); // fresh token; older tokens are now rejected
});
