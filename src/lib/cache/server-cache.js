import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache';

export const CacheTags = {
  USERS: 'users',
  POSTS: 'posts',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
};

export const CacheDuration = {
  NONE: 0,
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
  WEEK: 604800,
};

export function createCachedFunction(fn, keyParts, options = {}) {
  const {
    tags = [],
    revalidate = CacheDuration.MEDIUM,
  } = options;

  return unstable_cache(fn, keyParts, {
    tags,
    revalidate,
  });
}

export function invalidateCacheTag(tag) {
  try {
    revalidateTag(tag);
    return true;
  } catch (error) {
    console.error('Error invalidating cache tag:', tag, error);
    return false;
  }
}

export function invalidateCacheTags(tags) {
  return tags.map(tag => invalidateCacheTag(tag));
}

export function invalidateCachePath(path, type = 'page') {
  try {
    revalidatePath(path, type);
    return true;
  } catch (error) {
    console.error('Error invalidating cache path:', path, error);
    return false;
  }
}

class ServerMemoryCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = CacheDuration.MEDIUM * 1000) {
    const expiresAt = ttl ? Date.now() + ttl : null;
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    if (ttl) {
      setTimeout(() => this.delete(key), ttl);
    }

    return true;
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  async getOrSet(key, fetchFn, ttl = CacheDuration.MEDIUM * 1000) {
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }
}

export const serverCache = new ServerMemoryCache();

export function withCache(handler, options = {}) {
  const {
    keyFn = (req) => req.url,
    ttl = CacheDuration.MEDIUM * 1000,
    condition = () => true,
  } = options;

  return async (req, context) => {
    if (!condition(req, context)) {
      return handler(req, context);
    }

    const cacheKey = typeof keyFn === 'function' ? keyFn(req, context) : keyFn;
    
    const cached = serverCache.get(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }

    const response = await handler(req, context);
    
    if (response.ok) {
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        serverCache.set(cacheKey, data, ttl);
      } catch (error) {
        console.error('Error caching response:', error);
      }
    }

    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'MISS');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

export function createCacheKey(...parts) {
  return parts.filter(Boolean).join(':');
}

const serverCacheUtils = {
  createCachedFunction,
  invalidateCacheTag,
  invalidateCacheTags,
  invalidateCachePath,
  serverCache,
  withCache,
  createCacheKey,
  CacheTags,
  CacheDuration,
};

export default serverCacheUtils;
