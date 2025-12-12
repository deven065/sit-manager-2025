export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(errors, message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', code = 'DATABASE_ERROR') {
    super(message, 500, code);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

export function errorResponse(error) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof AppError) {
    const response = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
    };

    if (error instanceof ValidationError && error.errors) {
      response.error.errors = error.errors;
    }

    if (error instanceof RateLimitError) {
      response.error.retryAfter = error.retryAfter;
    }

    if (isDevelopment && error.stack) {
      response.error.stack = error.stack;
    }

    return new Response(JSON.stringify(response), {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(error instanceof RateLimitError && {
          'Retry-After': error.retryAfter.toString(),
        }),
      },
    });
  }

  console.error('Unhandled error:', error);

  const response = {
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  };

  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  return new Response(JSON.stringify(response), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export class ErrorLogger {
  static log(error, context = {}) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      ...context,
    };

    if (error instanceof AppError && error.isOperational) {
      console.warn('[Operational Error]', JSON.stringify(errorInfo, null, 2));
    } else {
      console.error('[Critical Error]', JSON.stringify(errorInfo, null, 2));
    }

    return errorInfo;
  }

  static async logAsync(error, context = {}) {
    const errorInfo = this.log(error, context);
    return errorInfo;
  }
}

export function assertExists(value, message = 'Resource not found') {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
  return value;
}

export function assertAuthorized(condition, message = 'Unauthorized') {
  if (!condition) {
    throw new UnauthorizedError(message);
  }
}

export function assertPermission(condition, message = 'Forbidden') {
  if (!condition) {
    throw new ForbiddenError(message);
  }
}
