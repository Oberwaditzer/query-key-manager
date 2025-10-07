import type { QueryKey } from '@tanstack/react-query';

import {
  defineQueryOptions,
  isQueryDefinition,
  resolveQueryDefinition,
  type QueryDefinition,
  type ResolvedQueryOptions,
} from './query-definition.js';

type QueryFactory = (...args: unknown[]) => QueryDefinition;

export type QueryKeysSchemaValue =
  | QueryDefinition<unknown, unknown, unknown, QueryKey, never>
  | QueryFactory
  | QueryKeysSchemaRecord;

export interface QueryKeysSchemaRecord {
  [segment: string]: QueryKeysSchemaValue;
}

type NormalizeSchemaValue<T> = T extends QueryDefinition<
  infer TQueryFnData,
  infer TError,
  infer TData,
  infer TQueryKey,
  infer TPageParam
>
  ? ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
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
      ) => ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    : T extends Record<string, unknown>
      ? { [K in keyof T]: NormalizeSchemaValue<T[K]> }
      : never;

export type CreateQueryKeysResult<TSchema> = NormalizeSchemaValue<TSchema>;

export function createQueryKeys<TSchema extends Record<string, unknown>>(
  schema: TSchema,
): NormalizeSchemaValue<TSchema> {
  return transformNode(schema, []) as NormalizeSchemaValue<TSchema>;
}

export { defineQueryOptions };
export type { DefineQueryOptionsInput, QueryDefinition } from './query-definition.js';

function transformNode<TNode>(
  node: TNode,
  path: readonly string[],
): NormalizeSchemaValue<TNode> {
  if (isQueryDefinition(node)) {
    return resolveQueryDefinition(node, path) as NormalizeSchemaValue<TNode>;
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

    return resolveQueryDefinition(definition, path, args) as NormalizeSchemaValue<ReturnType<TFactory>>;
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}
