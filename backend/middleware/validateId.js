import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

export function validateId(paramName = 'id') {
  return (req, _res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
      return next(ApiError.notFound('Resource not found'));
    }
    next();
  };
}
