import type { QueryKey } from '@tanstack/react-query';

import {
  isQueryDefinition,
  type QueryDefinition,
} from './query-definition.js';

type AnyQueryDefinition = QueryDefinition<unknown, unknown, unknown, QueryKey>;
type AnyQueryFactory = (...args: unknown[]) => AnyQueryDefinition;

export type QuerySchemaValue =
  | AnyQueryDefinition
  | AnyQueryFactory
  | QuerySchemaRecord;

export interface QuerySchemaRecord {
  [segment: string]: QuerySchemaValue;
}

type MergeSchemaValues<A, B> = A extends AnyQueryDefinition
  ? B
  : B extends AnyQueryDefinition
    ? B
    : A extends AnyQueryFactory
      ? B
      : B extends AnyQueryFactory
        ? B
        : A extends Record<string, unknown>
          ? B extends Record<string, unknown>
            ? MergeSchemas<CastToRecord<A>, CastToRecord<B>>
            : B
          : B;

type MergeSchemas<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? K extends keyof A
      ? MergeSchemaValues<A[K], B[K]>
      : B[K]
    : K extends keyof A
      ? A[K]
      : never;
};

type EmptyObject = { [K in never]: never };

type MergeSchemasArray<Schemas extends readonly unknown[]> = Schemas extends [infer Head, ...infer Tail]
  ? MergeSchemas<CastToRecord<Head>, MergeSchemasArray<Tail>>
  : EmptyObject;

type CastToRecord<T> = T extends Record<string, unknown> ? T : EmptyObject;

export type MergeQueryKeysResult<Schemas extends readonly Record<string, unknown>[]> = MergeSchemasArray<Schemas>;

export function mergeQueryKeys<Schemas extends ReadonlyArray<Record<string, unknown>>>(
  ...schemas: Schemas
): MergeQueryKeysResult<Schemas> {
  if (schemas.length === 0) {
    return {} as MergeQueryKeysResult<Schemas>;
  }

  const merged = schemas.reduce<Record<string, unknown>>(
    (accumulator, schema) => deepMerge(accumulator, schema),
    {},
  );

  return merged as MergeQueryKeysResult<Schemas>;
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];

    if (isMergeable(existing) && isMergeable(value)) {
      result[key] = deepMerge(existing, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

function isMergeable(value: unknown): value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    return false;
  }

  if (isQueryDefinition(value)) {
    return false;
  }

  return true;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}
