/* eslint-disable dot-notation */
import { Schema, SchemaArray, SchemaNumber, SchemaObject, SchemaOf, SchemaString, isPrimitive, isReference, isSchemaArray, isSchemaBoolean, isSchemaNumber, isSchemaObject, isSchemaOf, isSchemaString } from './spec/schema'
import { docSchema } from './tsDoc'
import { brace, entries, escapeProp, toValidName } from './utils'

type Next = (schema: Schema) => string

/**
 *  Converts the schema to TypeScript type code.
 *
 * @param schema The schema object.
 * @param comment If true, add comments to object properties.
 * @param indent If there is no indent, it is displayed in one line.
 * @returns The TypeScript type code.
 */
export const schemaToType = (schema: Schema, comment = true, indent = '  '): string => {
  const next: Next = (schema: Schema) => schemaToType(schema, comment, indent)
  if (isSchemaObject(schema)) return toType.object(schema, indent, comment, next)
  if (isSchemaArray(schema)) return toType.array(schema, next)
  if (isSchemaOf(schema)) return toType.union(schema, next)
  if (isSchemaString(schema)) return toType.string(schema)
  if (isSchemaNumber(schema)) return toType.number(schema)
  if (isSchemaBoolean(schema)) return toType.boolean()
  if (isReference(schema)) return toValidName(schema.$ref.replace(/^#\/(components\/schemas|definitions)\//, ''))
  return 'never'
}

const toType = {
  boolean: () => 'boolean',
  number: (schema: SchemaNumber) => schema.enum ? schema.enum.map(x => `'${x}'`).join(' | ') || 'never' : 'number',
  string: (schema: SchemaString) => {
    if (schema.format === 'binary' || schema.format === 'byte') return 'File'
    return schema.enum ? schema.enum.map(x => `'${x}'`).join(' | ') || 'never' : 'string'
  },
  object: (schema: SchemaObject, indent: string, comment: boolean, next: Next) => {
    const { type, properties, required = [], ...rest } = schema
    if (!properties) return type
    const obj = brace(entries(properties).map(([key, value]) => {
      const tuple = `${escapeProp(key)}${required.includes(`${key}`) ? '' : '?'}: ${next(value)}`
      return `${comment ? docSchema(value) : ''}${tuple}`
    }), indent, '')
    return isSchemaOf(rest) ? `${obj} & (${next(rest)})` : obj
  },
  array: (schema: SchemaArray, next: Next) => `Array<${schema.items ? next(schema.items) : 'unknown'}>`,
  union: (schema: SchemaOf, next: Next) => {
    if ('allOf' in schema) return schema.allOf.map(next).join(' & ') || 'unknown'
    if ('oneOf' in schema) return schema.oneOf.map(next).join(' | ') || 'unknown'
    if ('anyOf' in schema) {
      const { anyOf } = schema
      const primitives = anyOf.filter(isPrimitive).map(next)
      const refs = anyOf.filter(isReference).map(next)
      const other = anyOf.filter(x => !isPrimitive(x) && !isReference(x)).map(next)
      const ret = (types: string | string[]) => [types, primitives].flat().join(' | ') || 'unknown'
      if (refs.length > 4 || other.length) return ret(`Partial<${[refs, other].flat().join(' & ')}>`)
      else return ret([combinations(refs), other].flat())
    }
    return 'never'
  },
}

const combinations = function (str1: string[]) {
  const array1: string[][] = []
  for (let x = 0, y = 1; x < str1.length; x++, y++) {
    array1[x] = str1.slice(x, y)
  }
  const combinations: string[] = []
  const len = Math.pow(2, array1.length)

  for (let i = 0; i < len; i++) {
    const temp: string[] = []
    for (let j = 0; j < array1.length; j++) {
      if ((i & Math.pow(2, j))) temp.push(...array1[j])
    }
    if (temp.length) combinations.push(temp.length > 1 ? `(${temp.join(' & ')})` : temp.join(''))
  }
  return combinations
}

/**
 * Generates ts code that exports all schemas as types.
 *
 * @param schemas Type name and schema object pairs.
 * @returns The TypeScript type code.
 */
export const genTypeFile = (schemas: Record<string, Schema> = {}) => `/* eslint-disable */\n${Object.entries(schemas).map(([name, schema]) =>
  `${docSchema(schema)}export type ${toValidName(name)} = ${schemaToType(schema)}`).join('\n')}`
