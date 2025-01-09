import { UnionToIntersection } from './typeUtils'
import { OpenAPI } from './spec/v3'
import { cloneDeep, get } from 'lodash'

export const notNullish = <T>(value: T | null | undefined): value is T => (value ?? undefined) !== undefined
export const isPresent = <T>(value: T | false | null | undefined): value is T => !!value || value === 0 || value === ''
export const keys = <T extends object>(obj: T) => Object.keys(obj) as Array<keyof UnionToIntersection<T>>
export const entries = <T extends object>(obj: T) => Object.entries(obj) as
  T extends Record<string, unknown> ? Array<[keyof UnionToIntersection<T>, T[keyof T]]> : Array<[string, unknown]>

/**
 * Converts a string to a valid variable name.
 * Invalid characters are replaced with `_`.
 *
 * @param key The string to convert.
 * @returns The valid name for a variable.
 */
export const toValidName = (key: PropertyKey) => {
  let name = String(key)
  if (!/^[\p{L}_$]/u.test(name)) name = `_${name}`
  return name.replace(/[^\p{L}\p{N}_$]/gu, '_')
}

/**
 * Escapes the string to be used as a property key.
 * If the string is a valid variable name, it is returned as is.
 * Otherwise, it is wrapped in single quotes.
 *
 * @param key The string to escape.
 * @returns The escaped string.
 */
export const escapeProp = (key: PropertyKey) => {
  const name = String(key)
  return /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name) ? name : `'${name.replace(/'/g, '\\\'')}'`
}

/**
 * Wraps the string in braces and returns it.
 * Apply indent when line breaks.
 * If there is no indent, it is displayed in one line.
 *
 * @param str The string to wrap.
 * @param multiline Whether to use multiline. Default is `true`. If str contains a line break, it is automatically set to `true`.
 * @param delimiter The multiline delimiter to use.
 * @returns The wrapped string.
 */
export const brace = (str: string | string[], multiline = true, delimiter = ',', [open, close]: '{}' | '[]' | '()' = '{}') => {
  str = [str].flat()
  if (str.join('').includes('\n')) multiline = true
  const text = str.join(multiline ? `${delimiter}\n` : ', ')
  if (!multiline) return `${open}${text.trim().replace(/,$/, '')}${close}`
  return `${open}\n${text.replace(/^/mg, '  ')}\n${close}`
}

/**
 * Returns a regular expression that matches the variable name between variable boundaries.
 * @param varName The variable name to match.
 * @param flag The regular expression flag.
 */
export const variableBoundary = (varName: string, flag = '') => new RegExp([
  /(?<![\p{L}\p{N}_$])/u.source, // boundary
  varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  /(?![\p{L}\p{N}_$])/u.source, // boundary
].join(''), `u${flag}`)

/**
 * Resolves all $refs except schemas in the OpenAPI v3.0 spec.
 * @param spec The OpenAPI v3.0 spec.
 * @returns The resolved OpenAPI v3.0 spec.
 */
export const resolveRefs = (spec: OpenAPI): OpenAPI => {
  spec = cloneDeep(spec)
  const deep = (value: unknown, parent: object = {}, key: string | number = '') => {
    if (!(value instanceof Object)) return
    if ('$ref' in value && typeof value.$ref === 'string' && /^#\/components\/(?!schemas\/)/.test(value.$ref)) {
      parent[key] = get(spec.components, value.$ref.replace(/^#\/components\//, '').replace(/\//g, '.')) as unknown
    }
    Object.entries(value).forEach(([k, v]) => { deep(v, value, k) })
  }

  deep(spec, undefined, undefined)
  return spec
}
