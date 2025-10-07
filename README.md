# query-key-manager

Utility helpers for organizing and composing [TanStack Query](https://tanstack.com/query/latest) keys.

## Getting Started

```bash
pnpm install @ocodio/query-key-manager
```

Add TanStack Query to your project if you have not already:

```bash
pnpm install @tanstack/react-query
```

## Usage

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

Provide a `queryKey` manually when you need advanced control. The helper preserves any keys you set yourself.

## Scripts

- `pnpm build` – Build the library to `dist/` as ESM and CJS with type declarations.
- `pnpm dev` – Watch mode build for local development.
- `pnpm lint` – Run ESLint with TypeScript rules.
- `pnpm test` – Execute unit tests with Vitest.
- `pnpm coverage` – Generate a coverage report.
- `pnpm docs` – Produce API documentation with TypeDoc.
- `pnpm release` – Run the Changesets release workflow.

## Versioning & Releases

This project uses [Changesets](https://github.com/changesets/changesets). After making changes, run:

```bash
pnpm changeset
```

Follow the prompts to document your updates and select the appropriate version bump. When you are ready to publish:

```bash
pnpm changeset version
pnpm install --lockfile-only
pnpm publish --access public
```

## License

[MIT](./LICENSE)
