/* eslint-disable dot-notation, no-use-before-define */
interface SchemaBase<T = unknown> {
  title?: string;
  example?: T;
  default?: T;
  description?: string;
}

export interface SchemaNumber extends SchemaBase<number> {
  type: 'number' | 'integer';
  format?: 'int32' | 'int64'
  enum?: readonly number[];
}

export interface SchemaString extends SchemaBase<string> {
  type: 'string';
  format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary'
  enum?: readonly string[];
}

export interface SchemaBoolean extends SchemaBase<boolean> { type: 'boolean'; }

export interface SchemaObject extends SchemaBase<Record<string, unknown>> {
  type: 'object';
  properties?: { [propertyName: string]: Schema };
  required?: readonly string[];
  oneOf?: Schema[];
}

export interface SchemaArray extends SchemaBase<unknown[]> { type: 'array'; items?: Schema;}
export interface Reference { $ref: `#/${'components/schemas' | 'definitions'}/${string}` }

export type SchemaOf = SchemaBase & ({allOf: Schema[]} | {anyOf: Schema[]} | {oneOf: Schema[]})
export type Schema = SchemaArray | SchemaObject | SchemaBoolean | SchemaString | SchemaNumber | SchemaOf | Reference

export const isReference = (schema?: object): schema is Reference => typeof schema?.['$ref'] === 'string'
export const isSchemaString = (schema?: object): schema is SchemaString => schema?.['type'] === 'string'
export const isSchemaNumber = (schema?: object): schema is SchemaNumber => schema?.['type'] === 'number' || schema?.['type'] === 'integer'
export const isSchemaBoolean = (schema?: object): schema is SchemaBoolean => schema?.['type'] === 'boolean'
export const isSchemaObject = (schema?: object): schema is SchemaObject => schema?.['type'] === 'object'
export const isSchemaArray = (schema?: object): schema is SchemaArray => schema?.['type'] === 'array'
export const isSchemaEnum = (schema?: object): schema is {enum: readonly unknown[]} => Array.isArray(schema?.['enum'])
export const isSchemaOf = (schema?: object): schema is SchemaOf => !!(schema?.['oneOf'] || schema?.['allOf'] || schema?.['anyOf'])
export const isPrimitive = (schema?: object): schema is SchemaString | SchemaNumber | SchemaBoolean => isSchemaString(schema) || isSchemaNumber(schema) || isSchemaBoolean(schema)

type ToObject<T extends {type: 'object'}> = T extends {properties: infer P, required?: infer R, oneOf?: readonly (infer One)[]} ?
  (R extends readonly (infer V extends keyof P)[]
    ? (keyof P extends Exclude<keyof P, V> ? {} : { -readonly [K in V]-?: SchemaToType<P[K]> })
    & (keyof P extends keyof P & V ? {} : {[K in Exclude<keyof P, V>]?: SchemaToType<P[K]>})
    : {-readonly [K in keyof P]?: SchemaToType<P[K]>}
  ) & SchemaToType<One>
  : Record<PropertyKey, unknown>

/**
 * Converts the schema to TypeScript type.
 * @param T The schema object.
 * @returns The TypeScript type.
 * @example
 * ```typescript
 * type T = SchemaToType<{type: 'object', properties: {a: {type: 'string'}, b: {type: 'number'}}, required: ['a']}>
 * type T_is = {a: string, b?: number}
 * ```
 */
export type SchemaToType<T> =
  T extends { enum: readonly (infer Enum)[] } ? Enum :
  T extends { type: 'boolean' } ? boolean :
  T extends { type: 'string' } ? string :
  T extends { type: 'number' | 'integer' } ? number :
  T extends { type: 'object' } ? ToObject<T> :
  T extends { type: 'array', items: infer Schema } ? SchemaToType<Schema>[] :
  T extends { oneOf: readonly (infer Schema)[] } ? SchemaToType<Schema>
  : unknown
