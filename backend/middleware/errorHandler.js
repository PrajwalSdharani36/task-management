import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    message = Object.values(errors)[0];
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists`;
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body is not valid JSON';
  } else if (
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    err.name === 'MongoNetworkError' ||
    /buffering timed out/.test(err.message)
  ) {
    statusCode = 503;
    message = 'Database is unavailable, please try again shortly';
  }

  if (statusCode >= 500) {
    console.error(err);
    if (env.isProduction && statusCode === 500) message = 'Something went wrong';
  }

  res.status(statusCode).json({ success: false, message, statusCode, ...(errors && { errors }) });
}
