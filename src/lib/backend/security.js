export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'self'"],
};

export function buildCSP(policy = contentSecurityPolicy) {
  return Object.entries(policy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

export function securityMiddleware(options = {}) {
  const headers = { ...securityHeaders, ...options.headers };
  
  if (options.csp !== false) {
    headers['Content-Security-Policy'] = buildCSP(options.csp);
  }

  return async (request) => {
    return { headers };
  };
}

export function corsMiddleware(options = {}) {
  const allowedOrigins = options.origins || ['*'];
  const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  const allowedHeaders = options.headers || ['Content-Type', 'Authorization'];
  const credentials = options.credentials ?? false;
  const maxAge = options.maxAge || 86400;

  return async (request) => {
    const origin = request.headers.get('origin');
    const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': maxAge.toString(),
          ...(credentials && { 'Access-Control-Allow-Credentials': 'true' }),
        },
      });
    }

    return {
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
        ...(credentials && { 'Access-Control-Allow-Credentials': 'true' }),
      },
    };
  };
}

export class CSRFProtection {
  constructor(options = {}) {
    this.secret = options.secret || this.generateSecret();
    this.tokenLength = options.tokenLength || 32;
    this.headerName = options.headerName || 'x-csrf-token';
    this.cookieName = options.cookieName || 'csrf-token';
  }

  generateSecret() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(this.tokenLength)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async verifyToken(request, token) {
    const cookieToken = this.getTokenFromCookie(request);
    return cookieToken && cookieToken === token;
  }

  getTokenFromCookie(request) {
    const cookies = request.headers.get('cookie') || '';
    const match = cookies.match(new RegExp(`${this.cookieName}=([^;]+)`));
    return match ? match[1] : null;
  }

  middleware() {
    return async (request) => {
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null;
      }

      const token = request.headers.get(this.headerName);
      const isValid = await this.verifyToken(request, token);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return null;
    };
  }
}

export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

export function validateRequestSize(maxSize = 1024 * 1024) {
  return async (request) => {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Request body too large' }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return null;
  };
}

export const createCSRFProtection = (options) => new CSRFProtection(options);
