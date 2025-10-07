# Basic Example

This example shows how you can compose query schemas using `defineQueryOptions`, merge them from multiple files with `mergeQueryKeys`, and hydrate them with `createQueryKeys`.

```ts
import { createQueryKeys, defineQueryOptions, mergeQueryKeys } from '@ocodio/query-key-manager';
import { useQuery } from '@tanstack/react-query';

const userQueries = {
  users: {
    list: defineQueryOptions({
      staleTime: 60_000,
      queryFn: async () => fetch('/api/users').then((res) => res.json()),
    }),
  },
};

const adminQueries = {
  admin: {
    dashboard: defineQueryOptions({
      queryFn: async () => fetch('/api/admin/dashboard').then((res) => res.json()),
    }),
  },
};

const schema = mergeQueryKeys(userQueries, adminQueries);
const queries = createQueryKeys(schema);

function Dashboard() {
  const { data } = useQuery(queries.admin.dashboard);
  // ...
}
```

Because the package only publishes the compiled contents of `dist/`, anything kept under `examples/` is excluded from the build output automatically.
