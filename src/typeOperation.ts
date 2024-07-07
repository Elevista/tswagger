import { uniq } from 'lodash'
import { parametersToTuples } from './parametersToTuples'
import { schemaToType } from './schemaToType'
import { Schema } from './spec/schema'
import { Digit, Operation as OperationV2 } from './spec/v2'
import { Operation as OperationV3 } from './spec/v3'
import { isPresent } from './utils'
type Operation = OperationV2 | OperationV3

export const getOperationSchema = (operation: Operation) => {
  const { parameters = [], responses } = operation
  const { formData } = parametersToTuples(parameters)
  const requestBody = 'requestBody' in operation ? operation.requestBody : undefined
  const parameterBody = parameters.filter(x => x).flatMap(p => p.in === 'body' ? p : []).pop()
  const required = requestBody?.required ?? parameterBody?.required
  const isMultipart = !!(requestBody?.content['multipart/form-data'] || formData.length)
  const requestSchema = (requestBody?.content['application/json'] ?? requestBody?.content['multipart/form-data'] ?? parameterBody)?.schema
  const responseSchema = ({ content: undefined, ...responses.default, ...responses[201], ...responses[200] }).content?.['application/json']?.schema
  const errorSchemas: Schema[] = Object.keys(responses).filter((code): code is `${4|5}${Digit}${Digit}` => /^[45]\d\d$/.test(code))
    .map(code => ({ content: undefined, ...responses[code] }).content?.['application/json']?.schema).filter(isPresent)
  return { isMultipart, required, requestSchema, responseSchema, errorSchemas }
}

export const typeOperation = (operation: Operation) => {
  const { isMultipart, required, requestSchema, responseSchema, errorSchemas } = getOperationSchema(operation)
  const requestType = requestSchema && schemaToType(requestSchema, false, '')
  const responseType = responseSchema && schemaToType(responseSchema, false, '')
  const errorType = errorSchemas.length ? uniq(errorSchemas.map(schema => schemaToType(schema, false, ''))).join(' | ') : undefined

  return { isMultipart, required, requestType, responseType, errorType }
}
