const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// usage: router.get('/:id', validateId(), handler)  or validateId('movieId')
module.exports = (param = 'id') => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[param])) return next(new AppError(`Invalid ${param}`, 400));
  next();
};
