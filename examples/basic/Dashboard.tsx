import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { JSX } from 'react';

import { queries } from './schema';

export function Dashboard(): JSX.Element | null {
  const { data, isLoading, error } = useQuery(queries.admin.dashboard);

  if (isLoading) {
    return <p>Loading dashboard…</p>;
  }

  if (error instanceof Error) {
    return <p role="alert">Failed to load dashboard: {error.message}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <section>
      <h2>Widgets</h2>
      <p>{data.widgets}</p>
    </section>
  );
}
