import { createQueryKeys, defineQueryOptions } from '../../../../src';


export const userQueries = createQueryKeys({
  users: {
    list: defineQueryOptions({
      queryFn: () => [{ id: '1', name: 'Alice'}, { id: '2', name: 'Bob' }],
      staleTime: 100_000,
    }),
    adminUsers: defineQueryOptions({
      queryFn: () => [{ id: '1', name: 'Admin 1', timeStamp: new Date().toTimeString()}, { id: '2', name: 'Admin 2', timeStamp: new Date().toTimeString() }],
      staleTime: 100_000,
    }),
    detail: (id: string) =>
      defineQueryOptions({
        queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
      }),
  },
});