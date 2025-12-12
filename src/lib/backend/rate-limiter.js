import { MemoryCache } from '../cache/memory-cache';

const rateLimitCache = new MemoryCache({
  maxSize: 10000,
  defaultTTL: 60000,
});

export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
    this.skip = options.skip || (() => false);
    this.handler = options.handler || this.defaultHandler;
    this.cache = options.cache || rateLimitCache;
  }

  defaultKeyGenerator(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `ratelimit:${ip}`;
  }

  defaultHandler() {
    return new Response(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(this.windowMs / 1000).toString(),
        },
      }
    );
  }

  middleware() {
    return async (request) => {
      if (this.skip(request)) {
        return null;
      }

      const key = this.keyGenerator(request);
      const now = Date.now();
      const data = this.cache.get(key) || { requests: [], resetTime: now + this.windowMs };

      data.requests = data.requests.filter(timestamp => now - timestamp < this.windowMs);

      if (data.requests.length >= this.maxRequests) {
        return this.handler(request, data);
      }

      data.requests.push(now);
      this.cache.set(key, data, this.windowMs);

      return null;
    };
  }

  async check(request) {
    const middleware = this.middleware();
    return await middleware(request);
  }
}

export const createRateLimiter = (options) => new RateLimiter(options);

export const defaultRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 100,
});

export const strictRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 10,
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 50,
  keyGenerator: (request) => {
    const url = new URL(request.url);
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return `ratelimit:api:${url.pathname}:${ip}`;
  },
});

export function withRateLimit(handler, limiter = defaultRateLimiter) {
  return async (request, context) => {
    const limitResponse = await limiter.check(request);
    if (limitResponse) {
      return limitResponse;
    }
    return handler(request, context);
  };
}

export class TokenBucket {
  constructor(options = {}) {
    this.capacity = options.capacity || 100;
    this.refillRate = options.refillRate || 10;
    this.refillInterval = options.refillInterval || 1000;
    this.cache = options.cache || rateLimitCache;
  }

  getKey(identifier) {
    return `tokenbucket:${identifier}`;
  }

  consume(identifier, tokens = 1) {
    const key = this.getKey(identifier);
    const now = Date.now();
    const data = this.cache.get(key) || {
      tokens: this.capacity,
      lastRefill: now,
    };

    const timePassed = now - data.lastRefill;
    const refills = Math.floor(timePassed / this.refillInterval);
    data.tokens = Math.min(this.capacity, data.tokens + refills * this.refillRate);
    data.lastRefill = now;

    if (data.tokens >= tokens) {
      data.tokens -= tokens;
      this.cache.set(key, data, this.refillInterval * 10);
      return { allowed: true, remaining: data.tokens };
    }

    this.cache.set(key, data, this.refillInterval * 10);
    return { allowed: false, remaining: data.tokens };
  }
}

export const createTokenBucket = (options) => new TokenBucket(options);
