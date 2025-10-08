<h1 align="center">Query Key Manager</h1>

Manage your [TanStack Query](https://tanstack.com/query/latest) keys with ease. Central and type-safe schemas make it easy to keep your queries organized and avoid typos.

## Getting Started

```bash
npm install @ocodio/query-key-manager
```

Add TanStack Query to your project if you have not already:

```bash
npm install @tanstack/react-query
```

## Quick Start

Define your query schemas using the `createQueryKeys` function. The queries can be defined in a single file, in multiple and merged or totally separated.

```ts
import { createQueryKeys, defineQueryOptions } from '@ocodio/query-key-manager';

const queries = createQueryKeys({
  users: {
    list: defineQueryOptions({
      queryFn: () => fetch('/api/users').then((res) => res.json()),
    }),
    detail: (id: string) =>
      defineQueryOptions({
        queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
      }),
  },
});

// Static query options receive an automatic key based on their path.
queries.users.list.queryKey; // ['users', 'list']

// Factories inherit the path and append their arguments when no queryKey is provided.
queries.users.detail('123').queryKey; // ['users', 'detail', '123']
```

Looking for a fuller setup? Check out [examples/basic](./examples/basic/README.md) for a React Query wiring example.

## Motivation

[TanStack Query](https://tanstack.com/query/latest) is a great library for managing your data fetching. It provides a lot of flexibility and is easy to use. However, it can be difficult to keep your queries organized and avoid typos. Especially when you have a lot of queries.

To solve this problem, I created this library. It provides a centralized place to define your queries and provides type-safety. It is also easy to merge schemas from multiple files. No extra dependencies are used besides TanStack Query.

## Documentation

### Defining Schemas

As mentioned above, get started with the `createQueryKeys` function. It takes a single object argument with the schema. The keys of the object are the paths of the queries.

```ts
import { createQueryKeys, defineQueryOptions } from '@ocodio/query-key-manager';

const queries = createQueryKeys({
  users: {
    list: defineQueryOptions({
      queryFn: () => fetch('/api/users').then((res) => res.json()),
    }),
    detail: (id: string) =>
      defineQueryOptions({
        queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
      }),
  },
});
```

### Composing Schemas

Split schemas across files and merge them before creating the final query helpers:

```ts
import { createQueryKeys, defineQueryOptions, mergeQueryKeys } from '@ocodio/query-key-manager';

const userQueries = {
  users: {
    list: defineQueryOptions({
      queryFn: () => fetch('/api/users').then((res) => res.json()),
    }),
  },
};

const adminQueries = {
  admin: {
    detail: (id: string) =>
      defineQueryOptions({
        queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
      }),
  },
};

const schema = mergeQueryKeys(userQueries, adminQueries);
const queries = createQueryKeys(schema);
```

### Manual Override

Provide a `queryKey` manually when you need advanced control. The helper preserves any keys you set yourself.

```ts
import { createQueryKeys, defineQueryOptions } from '@ocodio/query-key-manager';

const queries = createQueryKeys({
  users: {
    list: defineQueryOptions({
      queryKey: ['i-want-another-key', 'list'],
      queryFn: () => fetch('/api/users').then((res) => res.json()),
    }),
  },
});
```

### defineQueryOptions

The `defineQueryOptions` helper mirrors TanStack Query's `queryOptions` API, but makes `queryKey` optional so schemas can derive keys from their path and factory arguments. All other properties (`staleTime`, `gcTime`, `retry`, etc.) are supported as-is.

### Per-Query Override

You can still override settings when you consume the query. Spread the generated options and tweak what you need:

```ts
const { data } = useQuery({
  ...queries.users.list,
  staleTime: 1000,
});
```

### Usage with `QueryClient`

The generated helpers include the final `queryKey`. Use that when interacting with the client directly:

```ts
const queryClient = useQueryClient();

queryClient.setQueryData(queries.users.list.queryKey, data);
queryClient.invalidateQueries({ queryKey: queries.users.list.queryKey });
```

## Acknowledgements

- [TanStack Query](https://tanstack.com/query/latest)
- [Query Key Factory](https://github.com/lukemorales/query-key-factory)
  - Was a huge inspiration for this library. But as it wasn't updated for a while, I decided to create my own version based on `queryOptions`
  - Created by @lukemorales

## License

[MIT](./LICENSE)
