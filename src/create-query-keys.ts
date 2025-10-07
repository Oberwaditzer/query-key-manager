import {
  queryOptions,
  type QueryKey,
  type QueryOptions,
} from '@tanstack/react-query';

const QUERY_DEFINITION_SYMBOL = Symbol('query-key-manager.queryDefinition');

type QueryOptionsResolved<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = Omit<QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, 'queryKey'> & {
  queryKey: TQueryKey & QueryKey;
};

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

type AnyQueryDefinition = QueryDefinition<unknown, unknown, unknown, QueryKey, never>;

type QueryFactory = (...args: unknown[]) => AnyQueryDefinition;

export type QueryKeysSchemaValue =
  | QueryDefinition<unknown, unknown, unknown, QueryKey, never>
  | QueryFactory
  | QueryKeysSchemaRecord;

export interface QueryKeysSchemaRecord {
  [segment: string]: QueryKeysSchemaValue;
}

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

type NormalizeSchemaValue<T> = T extends QueryDefinition<
  infer TQueryFnData,
  infer TError,
  infer TData,
  infer TQueryKey,
  infer TPageParam
>
  ? QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam>
  : T extends (
        ...args: infer TArgs
      ) => QueryDefinition<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey,
        infer TPageParam
      >
    ? (
        ...args: TArgs
      ) => QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    : T extends Record<string, unknown>
      ? { [K in keyof T]: NormalizeSchemaValue<T[K]> }
      : never;

export type CreateQueryKeysResult<TSchema> = NormalizeSchemaValue<TSchema>;

export function createQueryKeys<TSchema extends Record<string, unknown>>(
  schema: TSchema,
): NormalizeSchemaValue<TSchema> {
  return transformNode(schema, []) as NormalizeSchemaValue<TSchema>;
}

function transformNode<TNode>(
  node: TNode,
  path: readonly string[],
): NormalizeSchemaValue<TNode> {
  if (isQueryDefinition(node)) {
    return ensureQueryKey(node, path) as NormalizeSchemaValue<TNode>;
  }

  if (typeof node === 'function') {
    return createFactory(node as QueryFactory, path) as NormalizeSchemaValue<TNode>;
  }

  if (isPlainObject(node)) {
    const entries = Object.entries(node as Record<string, unknown>).map(([segment, value]) => [
      segment,
      transformNode(value, [...path, segment]),
    ]);

    return Object.fromEntries(entries) as NormalizeSchemaValue<TNode>;
  }

  throw new TypeError(
    `Invalid schema value at "${path.join('.') || '<root>'}". Expected a query definition, factory, or nested schema.`,
  );
}

function createFactory<TFactory extends QueryFactory>(
  factory: TFactory,
  path: readonly string[],
): (...args: Parameters<TFactory>) => NormalizeSchemaValue<ReturnType<TFactory>> {
  return (...args: Parameters<TFactory>) => {
    const definition = factory(...args);
    if (!isQueryDefinition(definition)) {
      throw new TypeError(
        `Query factory at "${path.join('.')}" must return a query definition.`,
      );
    }

    return ensureQueryKey(definition, path, args) as NormalizeSchemaValue<ReturnType<TFactory>>;
  };
}

function ensureQueryKey<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
>(
  definition: QueryDefinition<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  path: readonly string[],
  args: readonly unknown[] = [],
): QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam> {
  const { options } = definition;

  if (Array.isArray(options.queryKey) && options.queryKey.length > 0) {
    return queryOptions(
      options as unknown as Parameters<typeof queryOptions>[0],
    ) as unknown as QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
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
  } as QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam>;

  return queryOptions(
    withKey as unknown as Parameters<typeof queryOptions>[0],
  ) as unknown as QueryOptionsResolved<TQueryFnData, TError, TData, TQueryKey, TPageParam>;
}

function isQueryDefinition(
  value: unknown,
): value is QueryDefinition<unknown, unknown, unknown, QueryKey, never> {
  return Boolean(value) && typeof value === 'object' && QUERY_DEFINITION_SYMBOL in (value as object);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}
