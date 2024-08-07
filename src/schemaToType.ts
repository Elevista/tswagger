/* eslint-disable dot-notation */
import { Schema, SchemaArray, SchemaNumber, SchemaObject, SchemaOf, SchemaString, isPrimitive, isReference, isSchemaArray, isSchemaBoolean, isSchemaNumber, isSchemaObject, isSchemaOf, isSchemaString } from './spec/schema'
import { docSchema } from './tsDoc'
import { brace, entries, escapeProp, toValidName, variableBoundary } from './utils'

type Next = (schema: Schema) => string

/**
 *  Converts the schema to TypeScript type code.
 *
 * @param schema The schema object.
 * @param comment If true, add comments to object properties.
 * @param multiline Whether to use multiline. Default is `true`. If str contains a line break, it is automatically set to `true`.
 * @returns The TypeScript type code.
 */
export const schemaToType = (schema: Schema, comment = true, multiline = true): string => {
  const next: Next = (schema: Schema) => schemaToType(schema, comment, multiline)
  if (isSchemaObject(schema)) return toType.object(schema, comment, multiline, next)
  if (isSchemaArray(schema)) return toType.array(schema, next)
  if (isSchemaOf(schema)) return toType.union(schema, next)
  if (isSchemaString(schema)) return toType.string(schema)
  if (isSchemaNumber(schema)) return toType.number(schema)
  if (isSchemaBoolean(schema)) return toType.boolean()
  if (isReference(schema)) return toValidName(schema.$ref.replace(/^#\/(components\/schemas|definitions)\//, ''))
  return 'unknown'
}

const toType = {
  boolean: () => 'boolean',
  number: (schema: SchemaNumber) => schema.enum ? schema.enum.length ? schema.enum.join(' | ') : 'never' : 'number',
  string: (schema: SchemaString) => {
    if (schema.format === 'binary' || schema.format === 'byte') return 'File'
    return schema.enum ? schema.enum.map(x => `'${x}'`).join(' | ') || 'never' : 'string'
  },
  object: (schema: SchemaObject, comment: boolean, multiline: boolean, next: Next) => {
    const { type, properties, required = [], ...rest } = schema
    if (!properties) return type
    const obj = brace(entries(properties).map(([key, value]) => {
      const tuple = `${escapeProp(key)}${required.includes(`${key}`) ? '' : '?'}: ${next(value)}`
      return `${comment ? docSchema(value) : ''}${tuple}`
    }), multiline, '')
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
 * @param code If code is provided, only the types used in the code are exported.
 * @returns The TypeScript type code.
 */
export const genTypeFile = (schemas: Record<string, Schema> = {}, code?: string) => {
  const entries = Object.entries(schemas).map(([name, schema]) => [toValidName(name), schema] as const)
  const exportCode = ([name, schema]: readonly [string, Schema]) => `${docSchema(schema)}export type ${name} = ${schemaToType(schema)}`
  if (!code) return `/* eslint-disable */\n${entries.map(exportCode).join('\n')}`

  const schemaReferenced: Record<string, undefined | boolean> = {}
  schemas = Object.fromEntries(entries)
  const refCheck = (schema?: Schema) => {
    if (isSchemaObject(schema)) Object.values(schema.properties ?? {}).forEach(refCheck)
    if (isSchemaArray(schema)) refCheck(schema.items)
    if (isReference(schema)) {
      const type = schemaToType(schema)
      if (schemaReferenced[type]) return
      schemaReferenced[type] = true
      refCheck(schemas[type])
    }
    if (isSchemaOf(schema)) {
      const of = 'allOf' in schema ? schema.allOf : 'oneOf' in schema ? schema.oneOf : schema.anyOf
      of.forEach(refCheck)
    }
  }
  entries.filter(([name]) => variableBoundary(name).test(code))
    .forEach(([name, schema]) => {
      schemaReferenced[name] = true
      refCheck(schema)
    })
  return `/* eslint-disable */\n${entries.filter(([name]) => schemaReferenced[name]).map(exportCode).join('\n')}`
}
