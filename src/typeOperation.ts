import { uniq } from 'lodash'
import { parametersToTuples } from './parametersToTuples'
import { schemaToType } from './schemaToType'
import { Schema } from './spec/schema'
import { Operation as OperationV2 } from './spec/v2'
import { Operation as OperationV3 } from './spec/v3'
import { isPresent } from './utils'
type Operation = OperationV2 | OperationV3

/**
 * Returns the schema for response, request, and error in the operation.
 * isMultipart indicates whether the request is multipart/form-data.
 * required indicates whether the request is required.
 *
 * @param operation The operation object.
 * @returns The schema for response, request, and error in the operation.
 */
export const getOperationSchema = (operation: Operation) => {
  const { parameters = [], responses } = operation
  const { formData } = parametersToTuples(parameters)
  const requestBody = 'requestBody' in operation ? operation.requestBody : undefined
  const parameterBody = parameters.filter(x => x).flatMap(p => p.in === 'body' ? p : []).pop()
  const required = requestBody?.required ?? parameterBody?.required
  const isMultipart = !!(requestBody?.content['multipart/form-data'] || formData.length)
  const requestSchema = (requestBody?.content['application/json'] ?? requestBody?.content['multipart/form-data'] ?? parameterBody)?.schema
  const jsonSchemaOf = (code: keyof typeof responses) => ({ content: undefined, ...responses[code] }).content?.['application/json']?.schema
  const successCodes = Object.keys(responses).filter((code): code is `2${string}` => /^2..$/.test(code))
  const responseSchemas: Schema[] = successCodes.map(jsonSchemaOf).filter(isPresent)
  const fallbackSchema = !successCodes.length && jsonSchemaOf('default')
  if (fallbackSchema) responseSchemas.push(fallbackSchema)
  const errorSchemas: Schema[] = Object.keys(responses).filter((code): code is `${4|5}${string}` => /^[45]..$/.test(code))
    .map(jsonSchemaOf).filter(isPresent)
  return {
    /** Indicates whether the request is multipart/form-data. */
    isMultipart,
    /** Indicates whether the request is required. */
    required,
    /** The schema for the request. */
    requestSchema,
    /** The schemas for the 2xx responses. If there is no 2xx response, the schema for the default response. */
    responseSchemas,
    /** The schemas for the errors. */
    errorSchemas,
  }
}

/**
 * Returns the type for the request, response, and errors in the operation.
 * isMultipart indicates whether the request is multipart/form-data.
 * required indicates whether the request is required.
 *
 * @param operation The operation object.
 * @returns The type for the request, response, and errors in the operation.
 */
export const typeOperation = (operation: Operation, comment = true) => {
  const { isMultipart, required, requestSchema, responseSchemas, errorSchemas } = getOperationSchema(operation)
  const requestType = requestSchema && schemaToType(requestSchema, comment, false)
  const responseType = responseSchemas.length ? uniq(responseSchemas.map(schema => schemaToType(schema, comment, false))).join(' | ') : undefined
  const errorType = errorSchemas.length ? uniq(errorSchemas.map(schema => schemaToType(schema, false, false))).join(' | ') : undefined
  return {
    /** Indicates whether the request is multipart/form-data. */
    isMultipart,
    /** Indicates whether the request is required. */
    required,
    /** The type for the request. */
    requestType,
    /** The type for the response. */
    responseType,
    /** The types for the errors. */
    errorType,
  }
}
