import { apiFile, axiosArrowCode } from './axiosTemplate'
import { parametersToTuples } from './parametersToTuples'
import { typeOperation } from './typeOperation'
import { MethodType, Operation as OperationV2, PathItem as PathItemV2, Swagger } from './spec/v2'
import { OpenAPI, Operation as OperationV3, PathItem as PathItemV3 } from './spec/v3'
import { brace, isPresent, toValidName, variableBoundary } from './utils'
import { tsDoc } from './tsDoc'
import { Schema } from './spec/schema'
import { traversePaths } from './traversePaths'
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

const methodTypes = ['get', 'post', 'put', 'delete'] satisfies MethodType[]
const hasBody: typeof methodTypes = ['post', 'put']

export const operationTupleConfig = (operation: Operation) => {
  const { parameters = [] } = operation
  const { query, path } = parametersToTuples(parameters)
  const body = convertBody(operation)
  const optional = /^[^:]+\?:/
  const tuples = query.map(x => x.tuple).concat(body.tuple ?? []).sort((a, b) =>
    optional.test(a) === optional.test(b) ? 0 : optional.test(a) ? 1 : -1)
  const entries = query.length ? `params: ${brace(query.map(x => x.entry).join(', '), query.length > 5 ? '  ' : '')},` : []
  return { pathTuples: path.map(x => x.tuple), tuples, entries, data: body.value }
}

export const generateApiMethods = (path: string, pathItem: PathItem) => brace(methodTypes.flatMap(methodType => {
  const operation = pathItem[methodType]
  if (!operation) return []
  const { tuples, entries, data } = operationTupleConfig(operation)
  const { responseType = 'unknown', errorType = 'unknown' } = typeOperation(operation)
  const pathTemplate = `\`${path.replace(/{([^}]+)}/g, '${$1}')}\`` // eslint-disable-line no-template-curly-in-string
  const config = entries.length ? brace(entries, entries.length > 1 ? '  ' : '') : undefined
  const args = [pathTemplate, hasBody.includes(methodType) && (data ?? (config && '{}')), config].filter(isPresent)
  return `${tsDoc(operation)}${methodType}: ${axiosArrowCode(responseType, errorType, tuples, methodType, args)}`
}))

export const genAxiosCode = (paths: Paths, relTypePath: string, components: Record<string, Schema> = {}, exportName = '') => {
  const obj = traversePaths(paths, generateApiMethods)
  const refTypes = Object.keys(components).map(toValidName).filter(x => variableBoundary(x).test(obj))
  return apiFile(obj, refTypes, relTypePath, exportName)
}