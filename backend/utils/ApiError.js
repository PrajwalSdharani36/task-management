export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }

  static badRequest(message = 'Invalid request data') {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Please log in to continue') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You are not authorized') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }
}
