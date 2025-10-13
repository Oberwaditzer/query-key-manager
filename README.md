<h1 align="center">Query Key Manager</h1>

Manage your [TanStack Query](https://tanstack.com/query/latest) keys with ease. Central and type-safe schemas make it easy to keep your queries organized and avoid typos.

Query Key Manager was created to centralize your data layer definitions, cut down on redundant hook factories, and keep query helpers usable in any context—not just inside React components.

## Key Features

- Keep every query key and option in one place with strongly-typed schemas.
- Compose schemas across files and domains while preserving build-time safety.
- Share the same helpers across React components, server utilities, and scripts.
- Stay close to TanStack Query APIs with zero runtime dependencies beyond the core library.

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Defining Schemas](#defining-schemas)
  - [Composing Schemas](#composing-schemas)
  - [Manual Override](#manual-override)
  - [defineQueryOptions](#definequeryoptions)
  - [Per-Query Override](#per-query-override)
  - [Usage with `QueryClient`](#usage-with-queryclient)
  - [Object-Level Query Keys](#object-level-query-keys)
  - [Using Outside React Components](#using-outside-react-components)
- [Examples](#examples)
- [Why Query Key Manager](#why-query-key-manager)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Installation

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
      staleTime: 30_000
    }),
    detail: (id: string) =>
      defineQueryOptions({
        queryFn: () => fetch(`/api/users/${id}`).then((res) => res.json()),
        gcTime: 100_000
      }),
  },
});

// Static query options receive an automatic key based on their path.
queries.users.list.queryKey; // ['users', 'list']

// Factories inherit the path and append their arguments when no queryKey is provided.
queries.users.detail('123').queryKey; // ['users', 'detail', '123']

// Object containers provide helpers that return the shared key for all nested queries.
queries.users.getQueryKey(); // ['users']
```

Looking for a fuller setup? Check out [examples/basic](./examples/basic/README.md) for a React Query wiring example.

## Usage

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

### Object-Level Query Keys

By default, every plain object in your schema gets a non-enumerable `getQueryKey()` helper. This returns the shared key for all queries nested under that branch, making it handy for bulk invalidations.

```ts
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

queries.users.getQueryKey(); // ['users']
queryClient.invalidateQueries({ queryKey: queries.users.getQueryKey() });
```

Leaf helpers that originate from `defineQueryOptions` or factories do not receive `getQueryKey()`—the helper attaches only to nested objects. If you prefer not to generate these helpers, pass the optional second argument:

```ts
const queries = createQueryKeys(schema, { generateKeysForObjects: false });
```

With the option disabled, no additional helpers are added.

### Using Outside React Components

Because every helper carries a ready-to-use `queryKey`, you can share them anywhere TanStack Query runs—CLI scripts, server handlers, or background jobs:

```ts
import { QueryClient } from '@tanstack/react-query';
import { queries } from './queries';

const queryClient = new QueryClient();

await queryClient.prefetchQuery(queries.users.detail('123'));
const cached = queryClient.getQueryData(queries.users.detail('123').queryKey);
```

## Examples

- [`examples/basic`](./examples/basic/README.md) — end-to-end setup demonstrating how to wire schemas into a React Query app.

## Why Query Key Manager

[TanStack Query](https://tanstack.com/query/latest) is a powerful toolkit, but large projects can end up with scattered query keys, duplicated hooks, and brittle string-based lookups. Query Key Manager provides a centralized, type-safe layer that keeps schemas consistent, reduces boilerplate, and ensures any consumer—React component or otherwise—gets reliable query keys with minimal effort. No extra dependencies are required beyond TanStack Query itself.

## Contributing

Contributions, bug reports, and feature ideas are all welcome.

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Add or adjust tests as needed and run the suite.
4. Open a pull request describing the change and its motivation.

## Acknowledgements

- [TanStack Query](https://tanstack.com/query/latest)
- [Query Key Factory](https://github.com/lukemorales/query-key-factory)
  - Was a huge inspiration for this library. But as it wasn't updated for a while, I decided to create my own version based on `queryOptions`
  - Created by @lukemorales

## License

[MIT](./LICENSE)
