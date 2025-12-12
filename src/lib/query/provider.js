'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DynamicQueryDevtools } from '../dynamic-imports';

export const defaultQueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

export function createQueryClient(config = {}) {
  return new QueryClient({
    ...defaultQueryClientConfig,
    ...config,
  });
}

export function QueryProvider({ children, config = {} }) {
  const [queryClient] = useState(() => createQueryClient(config));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <DynamicQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export const queryKeys = {
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), id],
  },
  
  posts: {
    all: ['posts'],
    lists: () => [...queryKeys.posts.all, 'list'],
    list: (filters) => [...queryKeys.posts.lists(), filters],
    details: () => [...queryKeys.posts.all, 'detail'],
    detail: (id) => [...queryKeys.posts.details(), id],
  },
  
  products: {
    all: ['products'],
    lists: () => [...queryKeys.products.all, 'list'],
    list: (filters) => [...queryKeys.products.lists(), filters],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (id) => [...queryKeys.products.details(), id],
  },
  
  categories: {
    all: ['categories'],
    list: () => [...queryKeys.categories.all, 'list'],
    detail: (id) => [...queryKeys.categories.all, 'detail', id],
  },

  settings: {
    all: ['settings'],
    user: () => [...queryKeys.settings.all, 'user'],
    app: () => [...queryKeys.settings.all, 'app'],
  },
};

export const queryCacheTime = {
  SHORT: 30000,
  MEDIUM: 60000,
  LONG: 300000,
  VERY_LONG: 600000,
  STATIC: Infinity,
};

export const queryStaleTime = {
  IMMEDIATE: 0,
  SHORT: 10000,
  MEDIUM: 30000,
  LONG: 60000,
  VERY_LONG: 300000,
  STATIC: Infinity,
};

export default QueryProvider;
