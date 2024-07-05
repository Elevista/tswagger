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
export const isSchemaOf = (schema?: object): schema is SchemaOf => !!(schema?.['oneOf'] || schema?.['allOf'] || schema?.['anyOf'])
export const isPrimitive = (schema?: object): schema is SchemaString | SchemaNumber | SchemaBoolean => isSchemaString(schema) || isSchemaNumber(schema) || isSchemaBoolean(schema)
