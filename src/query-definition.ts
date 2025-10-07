import {
  queryOptions,
  type QueryKey,
  type QueryOptions,
} from '@tanstack/react-query';

export const QUERY_DEFINITION_SYMBOL = Symbol('query-key-manager.queryDefinition');

export type DefineQueryOptionsInput<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Omit<QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, 'queryKey'> & {
  queryKey?: TQueryKey;
};

export interface QueryDefinition<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> {
  readonly [QUERY_DEFINITION_SYMBOL]: true;
  readonly options: DefineQueryOptionsInput<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >;
}

export type ResolvedQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = Omit<QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, 'queryKey'> & {
  queryKey: TQueryKey & QueryKey;
};

export function defineQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  options: DefineQueryOptionsInput<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
): QueryDefinition<TQueryFnData, TError, TData, TQueryKey, TPageParam> {
  return {
    [QUERY_DEFINITION_SYMBOL]: true,
    options,
  } as QueryDefinition<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
}

export function resolveQueryDefinition<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
>(
  definition: QueryDefinition<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  path: readonly string[],
  args: readonly unknown[] = [],
): ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> {
  const { options } = definition;

  if (Array.isArray(options.queryKey) && options.queryKey.length > 0) {
    return queryOptions(
      options as unknown as Parameters<typeof queryOptions>[0],
    ) as unknown as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
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
  } as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;

  return queryOptions(
    withKey as unknown as Parameters<typeof queryOptions>[0],
  ) as unknown as ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
}

export function isQueryDefinition(
  value: unknown,
): value is QueryDefinition<unknown, unknown, unknown, QueryKey, never> {
  return Boolean(value) && typeof value === 'object' && QUERY_DEFINITION_SYMBOL in (value as object);
}
