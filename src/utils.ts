import { UnionToIntersection } from './typeUtils'

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
 * @param indent The indent to apply.
 * @param delimiter The multiline delimiter to use.
 * @returns The wrapped string.
 */
export const brace = (str: string | string[], indent = '  ', delimiter = ',', [open, close]: '{}' | '[]' | '()' = '{}') => {
  const text = [str].flat().join(indent ? `${delimiter}\n` : ', ')
  if (!indent) return `${open}${text.trim().replace(/,$/, '')}${close}`
  return `${open}\n${text.replace(/^/mg, indent)}\n${close}`
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
