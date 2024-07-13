import { uniq } from 'lodash'
import { parameterToTuple } from './parametersToTuples'
import { Paths as PathsV2 } from './spec/v2'
import { Paths as PathsV3, MethodType } from './spec/v3'
import { brace, keys, toValidName } from './utils'
type Paths = PathsV2 | PathsV3;
type PathItem = Paths[keyof Paths]
const methodTypes = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] satisfies MethodType[]

if (!Array.prototype.with) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.with = function <T> (this: T[], index: number, value: T) {
    return [...this.slice(0, index), value, ...this.slice(index + 1)]
  }
}

/**
 * Traverses the path to create an endpoint.
 * Generates object code in a hierarchical structure,
 * and when it reaches the endpoint,
 * it calls the callback and inserts the value returned to the endpoint position.
 * Paths in the form of {key} are converted to functions.
 *
 * @param pathsObject Paths object to traverse.
 * @param endpoint Callback function to generate the endpoint. Should return entries code.
 * @returns The generated object code.
 * @example
 * input - {'/path1': {get: { ... }, post: { ... }}
 * output - `{path1: {get: (callback result), post: (callback result)}`
 */
export const traversePaths = (pathsObject: Paths, endpoint: (path: string, pathItem: PathItem) => string[]) => {
  const propertyName = (name: string) => name === '' ? '\'\'' : toValidName(name)
  const deep = (prefix: string, key: string): string => {
    if (prefix === '/' && key === '') return brace(endpoint('/', pathsObject['/']))

    const getNextPath = (next: string) => `${prefix}/${next}`.replace(/\/+/g, '/')
    const getEndpoints = (key: string) => keys(pathsObject).filter(x => x.startsWith(getNextPath(key)))
      .map(path => ({ path, operations: methodTypes.flatMap(methodType => pathsObject[path][methodType] || []) }))

    const content = (key: string) => {
      const path = getNextPath(key)
      const depth = path.match(/[^/]+/g)?.length ?? 0
      const endpointEntries = (key && pathsObject[path]) ? endpoint(path, pathsObject[path]) : []
      const endpointKeys = endpointEntries.map(x => x.match(/^.+?(?=:)/m)?.[0] || '').filter(x => x)
      const entries = [...endpointEntries, ...uniq(getEndpoints(key)
        .flatMap(x => x.path.split('/').at(depth + 1)?.replace(/[{}]/g, '') ?? []))
        .map(key => `${propertyName(endpointKeys.includes(key) ? `_${key}` : key)}: ${deep(path, key)}`)]
      return entries.length ? brace(entries) : undefined
    }

    const deepParamPath = () => {
      const [found] = getEndpoints(`{${key}}`)
      if (!found) return
      for (const { parameters } of found.operations) {
        const parameter = parameters?.find(x => x.in === 'path' && x.name === key)
        if (parameter) return `(${parameterToTuple(parameter).tuple}) => (${content(`{${key}}`)})`
      }
      return `(${toValidName(key)}: unknown) => (${content(`{${key}}`)})`
    }

    const paramPath = deepParamPath()
    const path = content(key)
    return (paramPath && path) ? `Object.assign(${paramPath}, ${path})` : paramPath || path || '{}'
  }
  return deep('', '')
}
