'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryCacheTime, queryStaleTime } from './provider.js';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export function useUsers(filters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchApi(`/api/users?${new URLSearchParams(filters)}`),
    staleTime: queryStaleTime.MEDIUM,
    gcTime: queryCacheTime.LONG,
  });
}

export function useUser(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchApi(`/api/users/${id}`),
    enabled: !!id,
    staleTime: queryStaleTime.MEDIUM,
    gcTime: queryCacheTime.LONG,
    ...options,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => 
      fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      if (previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), (old) => [...old, newUser]);
      }

      return { previousUsers };
    },

    onError: (err, newUser, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...userData }) =>
      fetchApi(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      }),

    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(updatedUser.id) });

      const previousUser = queryClient.getQueryData(queryKeys.users.detail(updatedUser.id));

      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);

      return { previousUser };
    },

    onError: (err, updatedUser, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(updatedUser.id),
          context.previousUser
        );
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) =>
      fetchApi(`/api/users/${id}`, {
        method: 'DELETE',
      }),

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });

      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueryData(queryKeys.users.lists(), (old) =>
        old?.filter((user) => user.id !== deletedId)
      );

      return { previousUsers };
    },

    onError: (err, deletedId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.lists(), context.previousUsers);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function usePosts(params = {}) {
  const { page = 1, limit = 10, ...filters } = params;

  return useQuery({
    queryKey: queryKeys.posts.list({ page, limit, ...filters }),
    queryFn: () =>
      fetchApi(`/api/posts?${new URLSearchParams({ page, limit, ...filters })}`),
    staleTime: queryStaleTime.SHORT,
    gcTime: queryCacheTime.MEDIUM,
    keepPreviousData: true,
  });
}

export function usePost(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id),
    queryFn: () => fetchApi(`/api/posts/${id}`),
    enabled: !!id,
    staleTime: queryStaleTime.MEDIUM,
    gcTime: queryCacheTime.LONG,
    ...options,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData) =>
      fetchApi('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
  });
}

export function createCrudHooks(resourceName, endpoint) {
  const keys = queryKeys[resourceName] || {
    all: [resourceName],
    lists: () => [resourceName, 'list'],
    list: (filters) => [resourceName, 'list', filters],
    details: () => [resourceName, 'detail'],
    detail: (id) => [resourceName, 'detail', id],
  };

  return {
    useList: (filters = {}) => {
      return useQuery({
        queryKey: keys.list(filters),
        queryFn: () => fetchApi(`${endpoint}?${new URLSearchParams(filters)}`),
        staleTime: queryStaleTime.MEDIUM,
      });
    },

    useDetail: (id) => {
      return useQuery({
        queryKey: keys.detail(id),
        queryFn: () => fetchApi(`${endpoint}/${id}`),
        enabled: !!id,
        staleTime: queryStaleTime.MEDIUM,
      });
    },

    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) =>
          fetchApi(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
          }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.all });
        },
      });
    },

    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, ...data }) =>
          fetchApi(`${endpoint}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: keys.detail(variables.id) });
          queryClient.invalidateQueries({ queryKey: keys.lists() });
        },
      });
    },

    useDelete: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) =>
          fetchApi(`${endpoint}/${id}`, {
            method: 'DELETE',
          }),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: keys.all });
        },
      });
    },
  };
}

const queryHooks = {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  usePosts,
  usePost,
  useCreatePost,
  createCrudHooks,
};

export default queryHooks;
