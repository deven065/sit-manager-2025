import { createCachedFunction, invalidateCacheTag, CacheDuration } from './server-cache.js';
import { queryCache } from './memory-cache.js';

export function cacheQuery(queryFn, options = {}) {
  const {
    key,
    tags = [],
    ttl = CacheDuration.MEDIUM,
    useMemoryCache = true,
  } = options;

  return async (...args) => {
    const cacheKey = key || `query:${queryFn.name}:${JSON.stringify(args)}`;

    if (useMemoryCache) {
      const cached = queryCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const result = await queryFn(...args);

    if (useMemoryCache) {
      queryCache.set(cacheKey, result, ttl * 1000);
    }

    return result;
  };
}

export function createCachedQuery(queryFn, options = {}) {
  const {
    keyParts = [],
    tags = [],
    revalidate = CacheDuration.MEDIUM,
  } = options;

  return createCachedFunction(queryFn, keyParts, {
    tags,
    revalidate,
  });
}

export class QueryCacheManager {
  constructor() {
    this.queries = new Map();
  }

  register(name, queryFn, options = {}) {
    const cachedQuery = cacheQuery(queryFn, {
      key: `query:${name}`,
      ...options,
    });

    this.queries.set(name, {
      fn: cachedQuery,
      tags: options.tags || [],
    });

    return cachedQuery;
  }

  get(name) {
    const query = this.queries.get(name);
    return query ? query.fn : null;
  }

  invalidateByTag(tag) {
    invalidateCacheTag(tag);

    for (const [name, query] of this.queries.entries()) {
      if (query.tags.includes(tag)) {
        queryCache.deletePattern(`query:${name}:`);
      }
    }
  }

  invalidate(name) {
    queryCache.deletePattern(`query:${name}:`);
  }

  clearAll() {
    queryCache.clear();
  }
}

export const queryCacheManager = new QueryCacheManager();

export function Cached(options = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const {
      tags = [],
      ttl = CacheDuration.MEDIUM,
    } = options;

    descriptor.value = async function (...args) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      const cached = queryCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      queryCache.set(cacheKey, result, ttl * 1000);
      
      return result;
    };

    return descriptor;
  };
}

export class CachedRepository {
  constructor(model, options = {}) {
    this.model = model;
    this.cacheTags = options.tags || [];
    this.defaultTTL = options.ttl || CacheDuration.MEDIUM;
  }

  async findById(id) {
    const cacheKey = `${this.model.name}:findById:${id}`;
    
    return queryCache.getOrSet(
      cacheKey,
      async () => {
        return this.model.findById(id);
      },
      this.defaultTTL * 1000
    );
  }

  async findAll(filter = {}) {
    const cacheKey = `${this.model.name}:findAll:${JSON.stringify(filter)}`;
    
    return queryCache.getOrSet(
      cacheKey,
      async () => {
        return this.model.find(filter);
      },
      this.defaultTTL * 1000
    );
  }

  async create(data) {
    const result = await this.model.create(data);
    
    this.invalidateCache();
    
    return result;
  }

  async update(id, data) {
    const result = await this.model.update(id, data);
    
    this.invalidateCache();
    
    return result;
  }

  async delete(id) {
    const result = await this.model.delete(id);
    
    this.invalidateCache();
    
    return result;
  }

  invalidateCache() {
    queryCache.deletePattern(`${this.model.name}:`);
    
    this.cacheTags.forEach(tag => invalidateCacheTag(tag));
  }
}

const queryCacheUtils = {
  cacheQuery,
  createCachedQuery,
  QueryCacheManager,
  queryCacheManager,
  Cached,
  CachedRepository,
};

export default queryCacheUtils;
