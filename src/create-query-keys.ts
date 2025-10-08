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
  | QueryDefinition<unknown, unknown, unknown, QueryKey>
  | QueryFactory
  | QueryKeysSchemaRecord;

export interface QueryKeysSchemaRecord {
  [segment: string]: QueryKeysSchemaValue;
}

export interface CreateQueryKeysOptions {
  generateKeysForObjects?: boolean;
}

type InternalCreateQueryKeysOptions = {
  generateKeysForObjects: boolean;
};

type ResolvedCreateQueryKeysOptions<
  TOptions extends CreateQueryKeysOptions | undefined,
> = TOptions extends { generateKeysForObjects: false }
  ? { generateKeysForObjects: false }
  : { generateKeysForObjects: true };

type ObjectGetQueryKeyMixin<
  TOptions extends InternalCreateQueryKeysOptions,
  TPath extends readonly string[],
> = TOptions['generateKeysForObjects'] extends true
  ? TPath extends []
    ? {}
    : { getQueryKey: () => readonly [...TPath] }
  : {};

type NormalizeSchemaRecord<
  T extends Record<string, unknown>,
  TOptions extends InternalCreateQueryKeysOptions,
  TPath extends readonly string[],
> = {
  [K in keyof T]: NormalizeSchemaValue<
    T[K],
    TOptions,
    readonly [...TPath, K & string]
  >;
} & ObjectGetQueryKeyMixin<TOptions, TPath>;

type NormalizeSchemaValue<
  T,
  TOptions extends InternalCreateQueryKeysOptions,
  TPath extends readonly string[],
> = T extends QueryDefinition<
  infer TQueryFnData,
  infer TError,
  infer TData,
  infer TQueryKey
>
  ? ResolvedQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  : T extends (
        ...args: infer TArgs
      ) => QueryDefinition<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey
      >
    ? (
        ...args: TArgs
      ) => NormalizeSchemaValue<
        ReturnType<T>,
        TOptions,
        TPath
      >
    : T extends Record<string, unknown>
      ? NormalizeSchemaRecord<T, TOptions, TPath>
      : never;

export type CreateQueryKeysResult<
  TSchema,
  TOptions extends CreateQueryKeysOptions | undefined = undefined,
> = NormalizeSchemaValue<TSchema, ResolvedCreateQueryKeysOptions<TOptions>, []>;

export function createQueryKeys<
  TSchema extends Record<string, unknown>,
  TOptions extends CreateQueryKeysOptions | undefined = undefined,
>(
  schema: TSchema,
  options?: TOptions,
): CreateQueryKeysResult<TSchema, TOptions> {
  const resolvedOptions =
    options?.generateKeysForObjects === false
      ? ({ generateKeysForObjects: false } as const)
      : ({ generateKeysForObjects: true } as const);

  return transformNode(schema, [] as const, resolvedOptions);
}

export { defineQueryOptions };
export { mergeQueryKeys } from './merge-query-keys.js';
export type {
  DefineQueryOptionsInput,
  QueryDefinition,
  ResolvedQueryOptions,
} from './query-definition.js';
export type { MergeQueryKeysResult } from './merge-query-keys.js';

function transformNode<
  TNode,
  const TPath extends readonly string[],
  TOptions extends InternalCreateQueryKeysOptions,
>(
  node: TNode,
  path: TPath,
  options: TOptions,
): NormalizeSchemaValue<TNode, TOptions, TPath> {
  if (isQueryDefinition(node)) {
    return resolveQueryDefinition(node, path) as NormalizeSchemaValue<TNode, TOptions, TPath>;
  }

  if (typeof node === 'function') {
    return createFactory(node as QueryFactory, path, options) as NormalizeSchemaValue<
      TNode,
      TOptions,
      TPath
    >;
  }

  if (isPlainObject(node)) {
    const entries = Object.entries(node as Record<string, unknown>).map(([segment, value]) => {
      const nextPath = [...path, segment] as const;
      return [segment, transformNode(value, nextPath, options)];
    });

    const record = Object.fromEntries(entries) as Record<string, unknown>;

    if (options.generateKeysForObjects && path.length > 0) {
      return attachGetQueryKey(record, () => path as unknown as QueryKey) as NormalizeSchemaValue<
        TNode,
        TOptions,
        TPath
      >;
    }

    return record as NormalizeSchemaValue<TNode, TOptions, TPath>;
  }

  throw new TypeError(
    `Invalid schema value at "${path.join('.') || '<root>'}". Expected a query definition, factory, or nested schema.`,
  );
}

function createFactory<
  TFactory extends QueryFactory,
  const TPath extends readonly string[],
  TOptions extends InternalCreateQueryKeysOptions,
>(
  factory: TFactory,
  path: TPath,
  options: TOptions,
): (...args: Parameters<TFactory>) => NormalizeSchemaValue<ReturnType<TFactory>, TOptions, TPath> {
  void options;

  return (...args: Parameters<TFactory>) => {
    const definition = factory(...args);
    if (!isQueryDefinition(definition)) {
      throw new TypeError(
        `Query factory at "${path.join('.')}" must return a query definition.`,
      );
    }

    return resolveQueryDefinition(definition, path, args) as NormalizeSchemaValue<
      ReturnType<TFactory>,
      TOptions,
      TPath
    >;
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function attachGetQueryKey<TTarget extends object, TKey>(
  target: TTarget,
  getKey: () => TKey,
): TTarget & { getQueryKey: () => TKey } {
  if (!('getQueryKey' in target)) {
    Object.defineProperty(target, 'getQueryKey', {
      value: getKey,
      enumerable: false,
      configurable: true,
    });
  }

  return target as TTarget & { getQueryKey: () => TKey };
}
