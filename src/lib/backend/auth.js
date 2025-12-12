export class JWTHandler {
  constructor(secret) {
    if (!secret) {
      throw new Error('JWT secret is required');
    }
    this.secret = new TextEncoder().encode(secret);
    this.algorithm = { name: 'HMAC', hash: 'SHA-256' };
  }

  base64UrlEncode(data) {
    const base64 = typeof data === 'string' 
      ? btoa(data)
      : btoa(String.fromCharCode(...new Uint8Array(data)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
  }

  async sign(payload, expiresIn = '24h') {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    const exp = this.parseExpiration(expiresIn);
    const claims = {
      ...payload,
      iat: now,
      exp: now + exp,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));
    const message = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      this.secret,
      this.algorithm,
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      this.algorithm.name,
      key,
      new TextEncoder().encode(message)
    );

    const encodedSignature = this.base64UrlEncode(signature);
    return `${message}.${encodedSignature}`;
  }

  async verify(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      this.secret,
      this.algorithm,
      false,
      ['verify']
    );

    const signature = Uint8Array.from(
      this.base64UrlDecode(encodedSignature),
      c => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      this.algorithm.name,
      key,
      signature,
      new TextEncoder().encode(message)
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  parseExpiration(expiresIn) {
    if (typeof expiresIn === 'number') return expiresIn;
    
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error('Invalid expiration format');

    const [, value, unit] = match;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(value) * multipliers[unit];
  }

  extractFromHeader(request, prefix = 'Bearer ') {
    const auth = request.headers.get('authorization');
    if (!auth || !auth.startsWith(prefix)) {
      return null;
    }
    return auth.substring(prefix.length);
  }
}

export class AuthMiddleware {
  constructor(jwtHandler, options = {}) {
    this.jwtHandler = jwtHandler;
    this.optional = options.optional ?? false;
    this.getUserFn = options.getUser || null;
  }

  async middleware(request, context) {
    const token = this.jwtHandler.extractFromHeader(request);

    if (!token) {
      if (this.optional) {
        return { user: null };
      }
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    try {
      const payload = await this.jwtHandler.verify(token);
      let user = payload;

      if (this.getUserFn) {
        user = await this.getUserFn(payload);
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      return { user, token: payload };
    } catch (error) {
      if (this.optional) {
        return { user: null, error: error.message };
      }
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}

export class RoleMiddleware {
  constructor(allowedRoles = []) {
    this.allowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  }

  middleware(request, context) {
    const { user } = context;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const userRole = user.role || user.roles;
    const hasRole = Array.isArray(userRole)
      ? userRole.some(role => this.allowedRoles.includes(role))
      : this.allowedRoles.includes(userRole);

    if (!hasRole) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return null;
  }
}

export function requireAuth(jwtHandler, options = {}) {
  const middleware = new AuthMiddleware(jwtHandler, options);
  return (request, context) => middleware.middleware(request, context);
}

export function requireRole(...roles) {
  const middleware = new RoleMiddleware(roles);
  return (request, context) => middleware.middleware(request, context);
}

export class SessionManager {
  constructor(options = {}) {
    this.sessions = new Map();
    this.ttl = options.ttl || 3600000;
    this.cookieName = options.cookieName || 'session-id';
  }

  createSession(userId, data = {}) {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      data,
      createdAt: Date.now(),
      lastAccess: Date.now(),
    });

    setTimeout(() => this.sessions.delete(sessionId), this.ttl);
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccess = Date.now();
      return session;
    }
    return null;
  }

  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getSessionFromRequest(request) {
    const cookies = request.headers.get('cookie') || '';
    const match = cookies.match(new RegExp(`${this.cookieName}=([^;]+)`));
    return match ? this.getSession(match[1]) : null;
  }
}

export const createJWTHandler = (secret) => new JWTHandler(secret);
export const createSessionManager = (options) => new SessionManager(options);
