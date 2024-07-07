import { UnionToIntersection } from './typeUtils'

export const camelCase = (str: string) => str.replace(/[-_. ]+([a-zA-Z])/g, (_, $1) => $1.toUpperCase())
export type CodeTree = string | number | Function | { [key in string]: CodeTree } | CodeTree[]
export const stringWrap: { <O>(obj: O): O } = (obj: any) => {
  if (typeof obj === 'string') return `'${obj}'`
  if (obj instanceof Array) return obj.map(stringWrap)
  if (typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, stringWrap(value)]))
  return obj
}
export const stringify = (obj: any, space = '  ', keepString = false) => {
  if (keepString) obj = stringWrap(obj)
  const deep = (node: CodeTree, depth = 0): string => {
    const [padEnd, indent] = [space.repeat(depth), space.repeat(++depth)]
    if (typeof node !== 'object') {
      const str = `${node}`
      const minIndent = str.match(/^\s+(\B|\b)/gm)?.sort().shift()
      return minIndent
        ? str.replace(new RegExp(`^${minIndent}`, 'gm'), padEnd)
        : str
    }
    if (node instanceof Array) return `[\n${node.map(x => indent + deep(x, depth)).join(',\n')}\n${padEnd}]`
    return `{\n${
      Object.entries(node).map(([key, value]) =>
          typeof value === 'function' ? deep(value, depth) : `${key}: ${deep(value, depth)}`,
      ).map(x => indent + x).join(',\n')
    }\n${padEnd}}`
  }
  return deep(obj)
}

export const keys = <T extends object>(obj: T) => Object.keys(obj) as Array<keyof UnionToIntersection<T>>
export const entries = <T extends object>(obj: T) => Object.entries(obj) as
  T extends Record<string, unknown> ? Array<[keyof UnionToIntersection<T>, T[keyof T]]> : Array<[string, unknown]>

export const notNullish = <T>(value: T | null | undefined): value is T => (value ?? undefined) !== undefined
export const isPresent = <T>(value: T | false | null | undefined): value is T => !!value || value === 0 || value === ''

export const assignIn = <T extends object>(target: T, ...sources: Array<Partial<T>>) => Object.assign(target, ...sources) as T

export const defineProperty = <T extends object, K extends string, V>(
  obj: T, key: K,
  attributes: Omit<PropertyDescriptor, 'get' | 'set'> & {get?(): V, set?(v: V): void},
) => Object.defineProperty(obj, key, attributes) as unknown as T & {[key in K]: V}

export const toValidName = (key: PropertyKey) => {
  let name = String(key)
  if (!/^[\p{L}_$]/u.test(name)) name = `_${name}`
  return name.replace(/[^\p{L}\p{N}_$]/gu, '_')
}

export const toSafeKey = (key: PropertyKey) => {
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
