import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JSX } from 'react';

import { queries } from './schema';

export function UsersList(): JSX.Element {
  const { data, isLoading, error } = useQuery(queries.users.list);

  if (isLoading) {
    return <p>Loading users…</p>;
  }

  if (error instanceof Error) {
    return <p role="alert">Failed to load users: {error.message}</p>;
  }

  if (!data) {
    return <p>No users found.</p>;
  }

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
