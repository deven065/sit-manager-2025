import { invalidateCacheTag, invalidateCachePath } from './server-cache.js';
import { globalCache, apiCache, queryCache } from './memory-cache.js';
import { idbCache } from './indexed-db-cache.js';

export class CacheInvalidator {
  constructor() {
    this.listeners = new Map();
  }

  async invalidateByTag(tag) {
    console.log(`Invalidating cache for tag: ${tag}`);
    
    invalidateCacheTag(tag);

    globalCache.deletePattern(`.*:${tag}:.*`);
    apiCache.deletePattern(`.*:${tag}:.*`);
    queryCache.deletePattern(`.*:${tag}:.*`);

    try {
      await idbCache.deleteByTag(tag);
    } catch (error) {
      console.error('Error invalidating IndexedDB by tag:', error);
    }

    this.triggerListeners('tag', tag);

    return true;
  }

  async invalidateByTags(tags) {
    const results = await Promise.all(
      tags.map(tag => this.invalidateByTag(tag))
    );
    return results.every(Boolean);
  }

  invalidateByPath(path, type = 'page') {
    console.log(`Invalidating cache for path: ${path}`);
    
    invalidateCachePath(path, type);

    const pathPattern = path.replace(/\//g, ':');
    globalCache.deletePattern(`.*${pathPattern}.*`);
    apiCache.deletePattern(`.*${pathPattern}.*`);

    this.triggerListeners('path', path);

    return true;
  }

  invalidateByPattern(pattern) {
    console.log(`Invalidating cache by pattern: ${pattern}`);
    
    const count = 
      globalCache.deletePattern(pattern) +
      apiCache.deletePattern(pattern) +
      queryCache.deletePattern(pattern);

    this.triggerListeners('pattern', pattern);

    return count;
  }

  async invalidateKey(key) {
    console.log(`Invalidating cache key: ${key}`);
    
    globalCache.delete(key);
    apiCache.delete(key);
    queryCache.delete(key);

    try {
      await idbCache.delete(key);
    } catch (error) {
      console.error('Error invalidating IndexedDB key:', error);
    }

    this.triggerListeners('key', key);

    return true;
  }

  async clearAll() {
    console.log('Clearing all caches');
    
    globalCache.clear();
    apiCache.clear();
    queryCache.clear();

    try {
      await idbCache.clear();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }

    this.triggerListeners('clear', null);

    return true;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(callback);
    
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  triggerListeners(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in cache invalidation listener:', error);
      }
    });
  }

  startAutoCleanup(interval = 300000) {
    this.cleanupInterval = setInterval(async () => {
      console.log('Running scheduled cache cleanup');
      
      const memoryCleaned = 
        globalCache.cleanup() +
        apiCache.cleanup() +
        queryCache.cleanup();

      let idbCleaned = 0;
      try {
        idbCleaned = await idbCache.cleanup();
      } catch (error) {
        console.error('Error cleaning up IndexedDB:', error);
      }

      console.log(`Cleaned up ${memoryCleaned} memory entries, ${idbCleaned} IndexedDB entries`);
    }, interval);

    return this.cleanupInterval;
  }

  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const cacheInvalidator = new CacheInvalidator();

export class MutationWithInvalidation {
  static async execute(mutationFn, invalidationStrategy) {
    try {
      const result = await mutationFn();

      if (invalidationStrategy.tags) {
        await cacheInvalidator.invalidateByTags(invalidationStrategy.tags);
      }

      if (invalidationStrategy.paths) {
        invalidationStrategy.paths.forEach(path => {
          cacheInvalidator.invalidateByPath(path);
        });
      }

      if (invalidationStrategy.patterns) {
        invalidationStrategy.patterns.forEach(pattern => {
          cacheInvalidator.invalidateByPattern(pattern);
        });
      }

      if (invalidationStrategy.keys) {
        await Promise.all(
          invalidationStrategy.keys.map(key => cacheInvalidator.invalidateKey(key))
        );
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Mutation failed:', error);
      return { success: false, error };
    }
  }
}

export function InvalidateCache(strategy) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const result = await originalMethod.apply(this, args);
      
      if (strategy.tags) {
        await cacheInvalidator.invalidateByTags(strategy.tags);
      }

      if (strategy.patterns) {
        strategy.patterns.forEach(pattern => {
          cacheInvalidator.invalidateByPattern(pattern);
        });
      }

      return result;
    };

    return descriptor;
  };
}

export const InvalidationStrategies = {
  USER_MUTATION: {
    tags: ['users'],
    patterns: ['^user:.*', '^users:.*'],
    paths: ['/users', '/profile'],
  },
  POST_MUTATION: {
    tags: ['posts'],
    patterns: ['^post:.*', '^posts:.*'],
    paths: ['/posts', '/feed'],
  },
  PRODUCT_MUTATION: {
    tags: ['products', 'categories'],
    patterns: ['^product:.*', '^products:.*', '^category:.*'],
    paths: ['/products', '/shop'],
  },
  SETTINGS_MUTATION: {
    tags: ['settings'],
    patterns: ['^settings:.*'],
    paths: ['/settings'],
  },
};

const invalidationUtils = {
  CacheInvalidator,
  cacheInvalidator,
  MutationWithInvalidation,
  InvalidateCache,
  InvalidationStrategies,
};

export default invalidationUtils;
