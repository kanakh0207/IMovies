const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT (cookie or "Authorization: Bearer <token>") and attaches the account to req
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies && req.cookies.token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  if (!token) throw new AppError('Not authorised, please log in', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT errors handled in errorMiddleware

  if (decoded.role === 'admin') {
    const admin = await Admin.findById(decoded.id);
    if (!admin) throw new AppError('Admin account no longer exists', 401);
    req.user = admin;
    req.role = 'admin';
  } else {
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User no longer exists', 401);
    if (!user.isActive) throw new AppError('Your account has been deactivated', 403);
    req.user = user;
    req.role = 'user';
  }
  next();
});

// Only logged-in admins
const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') return next(new AppError('Admin access only', 403));
  next();
};

// Only logged-in normal users (e.g. booking tickets)
const userOnly = (req, res, next) => {
  if (req.role !== 'user') return next(new AppError('Only customer accounts can do this', 403));
  next();
};

module.exports = { protect, adminOnly, userOnly };
