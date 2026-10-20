const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendToken } = require('../utils/generateToken');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new AppError('Email is already registered', 409);

  const user = await User.create({ name, email, password, phone });
  sendToken(res, 201, user, 'user');
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Your account has been deactivated', 403);

  sendToken(res, 200, user, 'user');
});

// POST /api/auth/logout  (works for users and admins)
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user, role: req.role });
});

// PUT /api/auth/me  - update name / phone / password
exports.updateMe = asyncHandler(async (req, res) => {
  if (req.role !== 'user') throw new AppError('Only customer accounts can update profile here', 403);
  const user = await User.findById(req.user._id).select('+password');
  const { name, phone, currentPassword, newPassword } = req.body;

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (newPassword) {
    if (!currentPassword || !(await user.matchPassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 400);
    }
    if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters', 400);
    user.password = newPassword;
  }
  await user.save();
  res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone } });
});
