export function successResponse(data, meta = {}) {
  return {
    success: true,
    data,
    ...meta,
  };
}

export function errorResponse(message, code, errors = null) {
  const response = {
    success: false,
    error: {
      message,
      code,
    },
  };

  if (errors) {
    response.error.errors = errors;
  }

  return response;
}

export function paginatedResponse(data, pagination) {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
  };
}

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export class ResponseBuilder {
  constructor() {
    this.statusCode = 200;
    this.headers = { 'Content-Type': 'application/json' };
    this.body = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  header(key, value) {
    this.headers[key] = value;
    return this;
  }

  json(data) {
    this.body = data;
    return this;
  }

  success(data, meta = {}) {
    this.body = successResponse(data, meta);
    return this;
  }

  error(message, code) {
    this.body = errorResponse(message, code);
    return this;
  }

  paginated(data, pagination) {
    this.body = paginatedResponse(data, pagination);
    return this;
  }

  build() {
    return new Response(JSON.stringify(this.body), {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

export const createResponse = () => new ResponseBuilder();

export class RequestDeduplicator {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5000;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  defaultKeyGenerator(request) {
    const url = new URL(request.url);
    return `${request.method}:${url.pathname}${url.search}`;
  }

  async deduplicate(request, handler) {
    const key = this.keyGenerator(request);
    
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.ttl) {
        return cached.promise;
      }
      this.cache.delete(key);
    }

    const promise = handler(request);
    this.cache.set(key, {
      promise,
      timestamp: Date.now(),
    });

    promise.finally(() => {
      setTimeout(() => this.cache.delete(key), this.ttl);
    });

    return promise;
  }

  middleware(handler) {
    return async (request, context) => {
      return this.deduplicate(request, () => handler(request, context));
    };
  }
}

export class IdempotencyHandler {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 86400000;
    this.headerName = options.headerName || 'idempotency-key';
  }

  getKey(request) {
    return request.headers.get(this.headerName);
  }

  async handle(request, handler) {
    const key = this.getKey(request);
    
    if (!key) {
      return handler(request);
    }

    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.ttl) {
        return cached.response.clone();
      }
      this.cache.delete(key);
    }

    const response = await handler(request);
    
    if (response.status >= 200 && response.status < 300) {
      this.cache.set(key, {
        response: response.clone(),
        timestamp: Date.now(),
      });

      setTimeout(() => this.cache.delete(key), this.ttl);
    }

    return response;
  }

  middleware(handler) {
    return async (request, context) => {
      return this.handle(request, () => handler(request, context));
    };
  }
}

export function createAPIVersioning(versions) {
  return async (request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts[0] === 'api' && pathParts[1]) {
      const versionMatch = pathParts[1].match(/^v(\d+)$/);
      if (versionMatch) {
        const version = parseInt(versionMatch[1]);
        if (versions[version]) {
          return { version, handler: versions[version] };
        }
      }
    }

    return { version: null, handler: null };
  };
}

export function composeMiddleware(...middlewares) {
  return async (request, context) => {
    let response = null;
    const enhancedContext = { ...context };

    for (const middleware of middlewares) {
      const result = await middleware(request, enhancedContext);
      
      if (result instanceof Response) {
        return result;
      }
      
      if (result && typeof result === 'object') {
        if (result.headers) {
          enhancedContext.headers = { ...enhancedContext.headers, ...result.headers };
        }
        Object.assign(enhancedContext, result);
      }
    }

    return enhancedContext;
  };
}

export function createAPIHandler(handler, middlewares = []) {
  return async (request, context = {}) => {
    const composedMiddleware = composeMiddleware(...middlewares);
    const enhancedContext = await composedMiddleware(request, context);
    
    if (enhancedContext instanceof Response) {
      return enhancedContext;
    }

    const response = await handler(request, enhancedContext);
    
    if (enhancedContext.headers) {
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(enhancedContext.headers)) {
        headers.set(key, value);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  };
}

export const createDeduplicator = (options) => new RequestDeduplicator(options);
export const createIdempotency = (options) => new IdempotencyHandler(options);
