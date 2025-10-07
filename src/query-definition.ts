import {
  queryOptions,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';

export const QUERY_DEFINITION_SYMBOL = Symbol('query-key-manager.queryDefinition');

export type DefineQueryOptionsInput<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'> & {
  queryKey?: TQueryKey;
};

export interface QueryDefinition<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  readonly [QUERY_DEFINITION_SYMBOL]: true;
  readonly options: DefineQueryOptionsInput<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >;
}

export type ResolvedQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'> & {
  queryKey: TQueryKey & QueryKey;
};

export function defineQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefineQueryOptionsInput<TQueryFnData, TError, TData, TQueryKey>,
): QueryDefinition<TQueryFnData, TError, TData, TQueryKey> {
  return {
    [QUERY_DEFINITION_SYMBOL]: true,
    options,
  } as QueryDefinition<TQueryFnData, TError, TData, TQueryKey>;
}

export function resolveQueryDefinition<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  definition: QueryDefinition<TQueryFnData, TError, TData, TQueryKey>,
  path: readonly string[],
  args: readonly unknown[] = [],
): ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  const { options } = definition;

  if (Array.isArray(options.queryKey) && options.queryKey.length > 0) {
    return queryOptions(
      options as unknown as Parameters<typeof queryOptions>[0],
    ) as unknown as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey>;
  }

  const filteredArgs = args.filter((value) => value !== undefined);
  const derivedKey = (path.length || filteredArgs.length)
    ? ([...path, ...filteredArgs] as QueryKey)
    : undefined;

  if (!derivedKey) {
    throw new Error(
      'Unable to derive a queryKey for a top-level schema entry. Provide a queryKey explicitly.',
    );
  }

  const withKey = {
    ...options,
    queryKey: derivedKey as TQueryKey & QueryKey,
  } as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey>;

  return queryOptions(
    withKey as unknown as Parameters<typeof queryOptions>[0],
  ) as unknown as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey>;
}

export function isQueryDefinition(
  value: unknown,
): value is QueryDefinition<unknown, unknown, unknown, QueryKey> {
  return Boolean(value) && typeof value === 'object' && QUERY_DEFINITION_SYMBOL in (value as object);
}
