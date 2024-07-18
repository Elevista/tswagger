import { parametersToTuples } from '../parametersToTuples'
import { Schema } from '../spec/schema'
import { MethodType, PathItem as PathItemV2, Swagger } from '../spec/v2'
import { OpenAPI, PathItem as PathItemV3 } from '../spec/v3'
import { multipart, multipartCode } from './template'
import { traversePaths } from '../traversePaths'
import { tsDoc } from '../tsDoc'
import { typeOperation } from '../typeOperation'
import { brace, isPresent, toValidName, variableBoundary } from '../utils'
type PathItem = PathItemV2 | PathItemV3
type Paths = (OpenAPI | Swagger)['paths']

const methodTypes = ['get', 'post', 'put', 'delete'] satisfies MethodType[]

/**
 * A function used as a callback function for the traversePaths function.
 * Traverses the methods for the endpoint and generates the call function code.
 *
 * @param path The path of the endpoint.
 * @param pathItem The endpoint object.
 * @returns The generated entries code.
 */
const generateApiMethods = (path: string, pathItem: PathItem) => methodTypes.flatMap(methodType => {
  const operation = pathItem[methodType]
  if (!operation) return []
  const { query } = parametersToTuples(operation.parameters ?? [], true)
  const { responseType = 'unknown', requestType, isMultipart, required } = typeOperation(operation)
  const optional = /^.+?\?:/m
  const tuples = query.map(x => x.tuple).concat(requestType ? `$body${required ? '' : '?'}: ${requestType}` : []).sort((a, b) =>
    optional.test(a) === optional.test(b) ? 0 : optional.test(a) ? 1 : -1)

  const pathTemplate = `\`${path.replace(/{([^}]+)}/g, '${$1}')}\`` // eslint-disable-line no-template-curly-in-string

  const payloads = [
    requestType && ((isMultipart) ? `formData: ${multipart}($body)` : 'body: $body'),
    !!query.length && `params: ${brace(query.map(x => x.entry), false)}`,
  ].filter(isPresent)
  const payload = payloads.length ? brace(payloads, false) : undefined
  const tuplesBrace = brace(tuples, tuples.join('').length > 100, undefined, '()')
  return `${tsDoc(operation)}${methodType}: ${arrowCode(responseType, tuplesBrace, pathTemplate, methodType, payload)}`
})

export const arrowCode = (responseType: string, tuples: string, path: string, methodType: MethodType, payload?: string) =>
   `<$R = ${responseType}>${tuples}: $P<$R, $T> => _(${[path, `'${methodType}'`, payload].filter(isPresent).join(', ')})`

export const genRequestCode = (paths: Paths, relTypePath: string, components: Record<string, Schema> = {}, exportName = '', tags?: string[]) => {
  const obj = traversePaths(paths, generateApiMethods, tags)
  const refTypes = Object.keys(components).map(toValidName).filter(x => variableBoundary(x).test(obj))

  return `/* eslint-disable */
${refTypes.length ? `import { ${refTypes.join(', ')} } from '${relTypePath}'}` : ''}
const $ep = <$T>(_) => (${obj})

type $P<R, T> = Promise<{ data: R, response: T }>
export ${exportName ? `const ${exportName} =` : 'default'} <T>(request: (path: string, method: string, payload: { params?: Record<string, unknown>, body?: Object, formData?: FormData }) => Promise<T>,
  getData: (request: T) => any) => $ep<T>((path, method, payload) => request(path, method, payload ?? {}).then(async response => ({ data: await getData(response), response })))
${variableBoundary(multipart).test(obj) ? multipartCode : ''}
`
}
