import { describe, expect, it } from 'vitest';

import { createQueryKeys, defineQueryOptions } from '../src';

describe('createQueryKeys', () => {
  it('adds query keys for static query options', () => {
    const queries = createQueryKeys({
      users: {
        list: defineQueryOptions({
          queryFn: async () => ['alice', 'bob'],
        }),
      },
    });

    expect(queries.users.list.queryKey).toEqual(['users', 'list']);
  });

  it('keeps existing query keys intact', () => {
    const queries = createQueryKeys({
      users: {
        list: defineQueryOptions({
          queryKey: ['custom', 'key'],
          queryFn: async () => ['alice', 'bob'],
        }),
      },
    });

    expect(queries.users.list.queryKey).toEqual(['custom', 'key']);
  });

  it('derives query keys for factories using arguments', () => {
    const queries = createQueryKeys({
      users: {
        detail: (id: string) =>
          defineQueryOptions({
            queryFn: async () => ({ id }),
          }),
      },
    });

    const options = queries.users.detail('user-1');

    expect(options.queryKey).toEqual(['users', 'detail', 'user-1']);
  });

  it('omits undefined arguments from generated keys', () => {
    const queries = createQueryKeys({
      users: {
        detail: (id?: string) =>
          defineQueryOptions({
            queryFn: async () => ({ id }),
          }),
      },
    });

    const options = queries.users.detail(undefined);

    expect(options.queryKey).toEqual(['users', 'detail']);
  });

  it('allows factories to opt out by providing custom keys', () => {
    const queries = createQueryKeys({
      users: {
        search: (variables: { term: string }) =>
          defineQueryOptions({
            queryKey: ['users', 'search', variables.term.toLowerCase()],
            queryFn: async () => ({ term: variables.term }),
          }),
      },
    });

    const options = queries.users.search({ term: 'Test' });

    expect(options.queryKey).toEqual(['users', 'search', 'test']);
  });

  it('supports deeply nested schemas', () => {
    const queries = createQueryKeys({
      admin: {
        users: {
          list: defineQueryOptions({
            queryFn: async () => [],
          }),
        },
      },
    });

    expect(queries.admin.users.list.queryKey).toEqual(['admin', 'users', 'list']);
  });
});
