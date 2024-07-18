import { uniq } from 'lodash'
import { parameterToTuple } from './parametersToTuples'
import { Paths as PathsV2 } from './spec/v2'
import { Paths as PathsV3, MethodType } from './spec/v3'
import { brace, keys, toValidName } from './utils'
type Paths = PathsV2 | PathsV3;
type PathItem = Paths[keyof Paths]
const methodTypes = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] satisfies MethodType[]

/**
 * Traverses the path to create an endpoint.
 * Generates object code in a hierarchical structure,
 * and when it reaches the endpoint,
 * it calls the callback and inserts the value returned to the endpoint position.
 * Paths in the form of {key} are converted to functions.
 *
 * @param paths Paths object to traverse.
 * @param endpoint Callback function to generate the endpoint. Should return entries code.
 * @param tags Tags to filter the paths. If not provided, all paths are traversed.
 * @returns The generated object code.
 * @example
 * input - {'/': {delete: { ... }, '/path1': {get: { ... }, post: { ... }}}
 * output - `{delete: (Function), path1: {get: (Function), post: (Function)}}}`
 */
export const traversePaths = (paths: Paths, endpoint: (path: string, pathItem: PathItem) => string[], tags: string[] = []) => {
  const pathsObject = filterTags(paths, tags)
  const propertyName = (name: string) => name === '' ? '\'\'' : toValidName(name)
  const deep = (prefix: string, key: string): string => {
    const getNextPath = (next: string) => `${prefix}/${next}`.replace(/\/+/g, '/')
    const getEndpoints = (key: string) => keys(pathsObject).filter(x => x.startsWith(getNextPath(key)))
      .map(path => ({ path, operations: methodTypes.flatMap(methodType => pathsObject[path][methodType] || []) }))

    const content = (key: string) => {
      const [path, slash] = [getNextPath(key), /\/(?=.)/g]
      const methodEntries = pathsObject[path] ? endpoint(path, pathsObject[path]) : []
      const methods = methodEntries.flatMap(x => x.match(/^.+?(?=:)/m)?.[0] || [])
      const entries = [...methodEntries, ...uniq(getEndpoints(key)
        .flatMap(x => x.path.split(slash).at(path.split(slash).length)?.replace(/[{}]/g, '') || []))
        .map(key => `${propertyName(methods.includes(key) ? `_${key}` : key)}: ${deep(path, key)}`)]
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

/**
 * Filters the paths object by tags.
 *
 * @param paths Paths object to traverse.
 * @param tags Tags to filter the paths. If not provided, all paths are traversed.
 * @returns The filtered paths object.
 */
const filterTags = (paths: Paths, tags: string[]) => {
  if (!tags.length) return paths
  paths = { ...paths }
  for (const key of Object.keys(paths)) {
    const pathItem = { ...paths[key] }
    let exist = false
    for (const method of methodTypes) {
      if (pathItem[method]?.tags?.some(x => tags?.includes(x))) exist = true
      else delete pathItem[method]
    }
    if (!exist) delete paths[key]
  }
  return paths
}
