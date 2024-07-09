/* eslint-disable dot-notation, no-use-before-define */
import { GetDepth1, RequireProps, GetDepth2 } from '../typeUtils'

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
export const isSchemaOf = (schema?: object): schema is SchemaOf => !!(schema?.['oneOf'] || schema?.['allOf'] || schema?.['anyOf'])
export const isPrimitive = (schema?: object): schema is SchemaString | SchemaNumber | SchemaBoolean => isSchemaString(schema) || isSchemaNumber(schema) || isSchemaBoolean(schema)

type ToObject<T extends { type: 'object' }> = (GetDepth1<T, 'properties'> extends infer P extends {}
  ? RequireProps<{ [K in keyof P]?: SchemaToType<P[K]> }, GetDepth2<T, 'required', number> & keyof P> : {})
  & (T extends { oneOf: readonly object[] } ? SchemaToType<T['oneOf'][number]> : {})

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
  T extends { type: 'object' } ? ToObject<T> :
  T extends { type: 'array', items: {} } ? Array<SchemaToType<T['items']>> :
  T extends { type: 'string' } ? T extends { enum: readonly string[] } ? T['enum'][number] : string :
  T extends { type: 'number' | 'integer' } ? T extends { enum: readonly number[] } ? T['enum'][number] : number :
  T extends { type: 'boolean' } ? boolean :
  T extends { oneOf: readonly object[] } ? SchemaToType<T['oneOf'][number]>
  : unknown
