/* eslint-disable no-undef */
import { createQueryKeys, defineQueryOptions, mergeQueryKeys } from '../../src';

const userQueries = {
  users: {
    list: defineQueryOptions({
      staleTime: 60_000,
      queryFn: async () => {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to load users');
        return response.json() as Promise<Array<{ id: string; name: string }>>;
      },
    }),
    detail: (id: string) =>
      defineQueryOptions({
        queryKey: ['user', id],
        queryFn: async () => {
          const response = await fetch(`/api/users/${id}`);
          if (!response.ok) throw new Error('Failed to load user');
          return response.json() as Promise<{ id: string; name: string }>;
        },
      }),
  },
};

const adminQueries = {
  admin: {
    dashboard: defineQueryOptions({
      queryFn: async () => {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) throw new Error('Failed to load admin dashboard');
        return response.json() as Promise<{ widgets: number }>;
      },
    }),
  },
};

export const schema = mergeQueryKeys(userQueries, adminQueries);
export const queries = createQueryKeys(schema);
