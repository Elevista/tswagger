import { UnionToIntersection } from './typeUtils'

export const notNullish = <T>(value: T | null | undefined): value is T => (value ?? undefined) !== undefined
export const isPresent = <T>(value: T | false | null | undefined): value is T => !!value || value === 0 || value === ''
export const keys = <T extends object>(obj: T) => Object.keys(obj) as Array<keyof UnionToIntersection<T>>
export const entries = <T extends object>(obj: T) => Object.entries(obj) as
  T extends Record<string, unknown> ? Array<[keyof UnionToIntersection<T>, T[keyof T]]> : Array<[string, unknown]>

export const toValidName = (key: PropertyKey) => {
  let name = String(key)
  if (!/^[\p{L}_$]/u.test(name)) name = `_${name}`
  return name.replace(/[^\p{L}\p{N}_$]/gu, '_')
}

export const escapeProp = (key: PropertyKey) => {
  const name = String(key)
  return /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name) ? name : `'${name}'`
}

export const brace = (str: string | string[], indent = '  ', [open, close]: '{}' | '[]' | '()' = '{}') => {
  const text = [str].flat().join(indent ? '\n' : ' ')
  if (!indent) return `${open}${text.trim().replace(/,$/, '')}${close}`
  return `${open}\n${text.replace(/^/mg, indent)}\n${close}`
}

export const variableBoundary = (varName: string, flag = '') => new RegExp([
  /(?<![\p{L}\p{N}_$])/u.source, // boundary
  varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  /(?![\p{L}\p{N}_$])/u.source, // boundary
].join(''), `u${flag}`)
