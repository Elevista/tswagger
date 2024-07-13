import { apiFile, axiosArrowCode } from './axiosTemplate'
import { parametersToTuples } from '../parametersToTuples'
import { typeOperation } from '../typeOperation'
import { MethodType, Operation as OperationV2, PathItem as PathItemV2, Swagger } from '../spec/v2'
import { OpenAPI, Operation as OperationV3, PathItem as PathItemV3 } from '../spec/v3'
import { brace, isPresent, keys, toValidName, variableBoundary } from '../utils'
import { tsDoc } from '../tsDoc'
import { Schema } from '../spec/schema'
import { traversePaths } from '../traversePaths'
import { multipart } from './template'
type Paths = (OpenAPI | Swagger)['paths']
type Operation = OperationV2 | OperationV3
type PathItem = PathItemV2 | PathItemV3

export const convertBody = (operation: Operation) => {
  const { requestType, required, isMultipart } = typeOperation(operation)
  if (!requestType) return {}
  const body = '$body'
  return {
    tuple: `${body}${required ? '' : '?'}: ${requestType}`,
    value: isMultipart ? `${multipart}(${body})` : body,
  }
}

const cruds = ['post', 'get', 'put', 'delete'] satisfies MethodType[]
const hasBody = (method: string) => (['post', 'put'] satisfies MethodType[]).some(x => x === method)
const isCrud = (x: string): x is typeof cruds[number] => cruds.some(y => y === x)

export const operationTupleConfig = (operation: Operation) => {
  const { parameters = [] } = operation
  const { query, path } = parametersToTuples(parameters, true)
  const body = convertBody(operation)
  const optional = /^.+?\?:/m
  const tuples = query.map(x => x.tuple).concat(body.tuple ?? []).sort((a, b) =>
    optional.test(a) === optional.test(b) ? 0 : optional.test(a) ? 1 : -1)
  const entries = query.length ? [`params: ${brace(query.map(x => x.entry), false)}`] : []
  return { pathTuples: path.map(x => x.tuple), tuples, entries, data: body.value }
}

/**
 * A function used as a callback function for the traversePaths function.
 * Traverses the methods for the endpoint and generates the call function code.
 *
 * @param path The path of the endpoint.
 * @param pathItem The endpoint object.
 * @returns The generated entries code.
 */
export const generateApiMethods = (path: string, pathItem: PathItem) => keys(pathItem).filter(isCrud).flatMap(crud => {
  const operation = pathItem[crud]
  if (!operation) return []
  const { tuples, entries, data } = operationTupleConfig(operation)
  const { responseType = 'unknown', errorType = 'unknown' } = typeOperation(operation)
  const pathTemplate = `\`${path.replace(/{([^}]+)}/g, '${$1}')}\`` // eslint-disable-line no-template-curly-in-string
  const config = entries.length ? brace(entries, entries.length > 1) : undefined
  const args = [pathTemplate, hasBody(crud) && (data ?? (config && '{}')), config].filter(isPresent)
  const tuplesBrace = brace(tuples, tuples.join('').length > 100, undefined, '()')
  return `${tsDoc(operation)}${crud}: ${axiosArrowCode(responseType, errorType, tuplesBrace, crud, args)}`
})

export const genAxiosCode = (paths: Paths, relTypePath: string, components: Record<string, Schema> = {}, exportName = '') => {
  const obj = traversePaths(paths, generateApiMethods)
  const refTypes = Object.keys(components).map(toValidName).filter(x => variableBoundary(x).test(obj))
  return apiFile(obj, refTypes, relTypePath, exportName)
}
