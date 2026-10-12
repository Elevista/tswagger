/* eslint-disable dot-notation, no-use-before-define */
interface SchemaBase<T = unknown> {
  title?: string;
  example?: T;
  examples?: readonly T[] | { [name: string]: { summary?: string, description?: string, value?: T } };
  default?: T;
  const?: T;
  description?: string;
  deprecated?: boolean;
  nullable?: boolean
}

type TypeOf<T extends string> = T | (T extends unknown ? readonly [T, 'null'] | readonly ['null', T] : never)

export interface SchemaNumber extends SchemaBase<number> {
  type: TypeOf<'number' | 'integer'>;
  format?: 'int32' | 'int64' | (string & {})
  enum?: readonly number[];
}

export interface SchemaString extends SchemaBase<string> {
  type: TypeOf<'string'>;
  format?: 'date' | 'date-time' | 'password' | 'byte' | 'binary' | (string & {})
  enum?: readonly string[];
}

export interface SchemaBoolean extends SchemaBase<boolean> { type: TypeOf<'boolean'>; }
export interface SchemaNull extends SchemaBase<null> { type: 'null'; }

export interface SchemaObject extends SchemaBase<Record<string, unknown>> {
  type: TypeOf<'object'>;
  properties?: { [propertyName: string]: Schema };
  additionalProperties?: boolean | Schema;
  required?: readonly string[];
  oneOf?: Schema[];
}

export interface SchemaArray extends SchemaBase<unknown[]> { type: TypeOf<'array'>; items?: Schema;}
export interface Reference { $ref: `#/${`components/${string}` | 'definitions'}/${string}`, nullable?: boolean }

export type SchemaOf = SchemaBase & ({allOf: Schema[]} | {anyOf: Schema[]} | {oneOf: Schema[]})
export type Schema = SchemaArray | SchemaObject | SchemaBoolean | SchemaString | SchemaNumber | SchemaNull | SchemaOf | Reference

export const isReference = (schema?: object): schema is Reference => typeof schema?.['$ref'] === 'string'
export const isNullable = (schema?: object) => schema?.['nullable'] === true || [schema?.['type']].flat().includes('null')
export const isSchemaString = (schema?: object): schema is SchemaString => typeName(schema) === 'string'
export const isSchemaNumber = (schema?: object): schema is SchemaNumber => ['number', 'integer'].includes(`${typeName(schema)}`)
export const isSchemaBoolean = (schema?: object): schema is SchemaBoolean => typeName(schema) === 'boolean'
export const isSchemaNull = (schema?: object): schema is SchemaNull => typeName(schema) === 'null'
export const isSchemaObject = (schema?: object): schema is SchemaObject => typeName(schema) === 'object'
export const isSchemaArray = (schema?: object): schema is SchemaArray => typeName(schema) === 'array'
export const isSchemaEnum = (schema?: object): schema is {enum: readonly unknown[]} => Array.isArray(schema?.['enum'])
export const isSchemaConst = (schema?: object): schema is {const: unknown} => schema?.['const'] !== undefined
export const isSchemaOf = (schema?: object): schema is SchemaOf => !!(schema?.['oneOf'] || schema?.['allOf'] || schema?.['anyOf'])
export const isPrimitive = (schema?: object): schema is SchemaString | SchemaNumber | SchemaBoolean | SchemaNull => isSchemaString(schema) || isSchemaNumber(schema) || isSchemaBoolean(schema) || isSchemaNull(schema)
export const isJsonSchema = (schema?: object): schema is Schema => isSchemaArray(schema) || isSchemaObject(schema) || isSchemaBoolean(schema) || isSchemaString(schema) || isSchemaNumber(schema) || isSchemaNull(schema) || isSchemaConst(schema) || isSchemaOf(schema) || isReference(schema)

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
  T extends { nullable: true } ? SchemaToType<Omit<T, 'nullable'>> | null :
  T extends { type: readonly [infer Type, 'null'] } ? SchemaToType<Omit<T, 'type'> & { type: Type }> | null :
  T extends { type: readonly ['null', infer Type] } ? SchemaToType<Omit<T, 'type'> & { type: Type }> | null :
  T extends { const: infer Const } ? Const :
  T extends { enum: readonly (infer Enum)[] } ? Enum :
  T extends { type: 'null' } ? null :
  T extends { type: 'boolean' } ? boolean :
  T extends { type: 'string' } ? string :
  T extends { type: 'number' | 'integer' } ? number :
  T extends { type: 'object' } ? ToObject<T> :
  T extends { type: 'array', items: infer Schema } ? SchemaToType<Schema>[] :
  T extends { oneOf: readonly (infer Schema)[] } ? SchemaToType<Schema>
  : unknown

const typeName = (schema?: object): unknown => {
  const type: unknown = schema?.['type']
  return type === 'null' ? type : [type].flat().find(x => x !== 'null')
}
