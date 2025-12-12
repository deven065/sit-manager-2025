# SIT Manager 2025

Next.js application with comprehensive caching strategy implementation.

## Caching Layers

### Client-Side
- **Memory Cache** (`src/lib/cache/memory-cache.js`) - Fast in-memory storage with TTL
- **IndexedDB Cache** (`src/lib/cache/indexed-db-cache.js`) - Persistent browser storage
- **React Query** (`src/lib/query/`) - State management with automatic caching

### Server-Side
- **Server Cache** (`src/lib/cache/server-cache.js`) - Next.js cache API integration
- **Query Cache** (`src/lib/cache/query-cache.js`) - Database query caching
- **Invalidation** (`src/lib/cache/invalidation.js`) - Tag-based cache invalidation

## Usage

```javascript
import { 
  globalCache,
  createCachedFunction,
  CacheTags,
  cacheInvalidator 
} from '@/lib';

globalCache.set('key', data, 60000);
const cached = globalCache.get('key');

const getCached = createCachedFunction(fetchData, ['key'], { 
  tags: [CacheTags.USERS] 
});

cacheInvalidator.invalidateByTag(CacheTags.USERS);
```

## Development

```bash
npm run dev
npm run build
npm start
```
