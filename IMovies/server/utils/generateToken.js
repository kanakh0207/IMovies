const jwt = require('jsonwebtoken');

const generateToken = (id, role = 'user') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Sends token as httpOnly cookie AND in the JSON body (for Postman / mobile clients)
const sendToken = (res, statusCode, account, role = 'user') => {
  const token = generateToken(account._id, role);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    success: true,
    token,
    user: { _id: account._id, name: account.name, email: account.email, role, phone: account.phone },
  });
};

module.exports = { generateToken, sendToken };
