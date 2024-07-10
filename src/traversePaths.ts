import { uniq } from 'lodash'
import { parameterToTuple } from './parametersToTuples'
import { Paths as PathsV2 } from './spec/v2'
import { Paths as PathsV3, MethodType } from './spec/v3'
import { brace, keys, notNullish, toValidName } from './utils'
import { tsDoc } from './tsDoc'
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
 * @param endpoint Callback function to generate the endpoint.
 * @returns The generated object code.
 * @example
 * input - {'/path1': {get: { ... }, post: { ... }}
 * output - `{path1: {get: (callback result), post: (callback result)}`
 */
export const traversePaths = (pathsObject: Paths, endpoint: (path: string, pathItem: PathItem) => string) => {
  const propertyName = (name: string) => name === '' ? '\'\'' : toValidName(name)
  const delBrace = <T extends string | undefined>(key: T) => key?.replace(/[{}]/g, '') as T
  const pathSlice = (path: string, to: number) => path.split('/').slice(0, to).join('/')
  const pathAt = (path: string, index: number) => path.split('/').at(index)
  const endpoints = keys(pathsObject).flatMap(path => methodTypes.flatMap(methodType =>
    pathsObject[path][methodType] ? { path, methodType, operation: pathsObject[path][methodType] } : []))

  const deep = (prefix: string): string => {
    const paths = prefix.split('/')
    const key = delBrace(paths.at(-1) ?? '/')
    const next = (lastPath: string) => {
      const path = paths.with(paths.length - 1, lastPath).join('/')
      const nextEndpoints = endpoints.filter((x) => pathSlice(x.path, paths.length) === path)
      const nextKeys = uniq(nextEndpoints.map((x) => pathAt(x.path, paths.length)).filter(notNullish).map(delBrace))
      const nextEntries = pathsObject[path]
        ? endpoint(path, pathsObject[path])
        : nextKeys.length
          ? brace(nextKeys.map(key => ({ key, path: `${path}/${key}` }))
            .map(({ path, key }) => `${tsDoc(pathsObject[path])}${propertyName(key)}: ${deep(path)}`))
          : undefined
      const tuple = nextEndpoints.flatMap(({ operation: { parameters = [] } }) => {
        const parameter = parameters.find(x => x.in === 'path' && x.name === key)
        return parameter ? parameterToTuple(parameter).tuple : []
      }).pop()
      return tuple ? `(${tuple}) => (${nextEntries})` : nextEntries
    }

    const nextFunction = next(`{${key}}`)
    const nextObject = next(key)
    return nextFunction && nextObject ? `Object.assign(${nextFunction}, ${nextObject})` : nextFunction || nextObject || ''
  }
  return deep('')
}
