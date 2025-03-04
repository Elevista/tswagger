import { Parameter as ParameterV2 } from './spec/v2'
import { Parameter as ParameterV3 } from './spec/v3'
import { escapeProp, toValidName } from './utils'
import { schemaToType } from './schemaToType'
import { tsDoc } from './tsDoc'
import { Get } from './typeUtils'
import { isJsonSchema } from './spec/schema'
export type Parameter = ParameterV2 | ParameterV3

export type TupleInfo = {
  /**
   * A object entry code
   * @example `originalName: validName`
   */
  entry: string
  /**
   * The typescript tuple
   * @example `name: string`
   */
  tuple: string
}

/**
 * Converts a parameter object to a tuple representation.
 *
 * @param x - The parameter object, which can be of type `ParameterV2` or `ParameterV3`.
 * @param comment - Optional boolean indicating whether to include documentation comments.
 * @param multiline - Optional boolean indicating whether to format the output as multiline.
 * @returns An object containing the entry and tuple representation of the parameter.
 */
export const parameterToTuple = (x: ParameterV2 | ParameterV3, comment?: boolean, multiline?: boolean): TupleInfo => {
  const schema = 'type' in x ? x : x.schema
  const validName = toValidName(x.name)
  const doc = comment ? tsDoc(schema) : ''
  const [name, label] = [x.name, `${validName}${(x.required || x.in === 'path') ? '' : '?'}`]
  const entry = name === validName ? name : `${escapeProp(name)}: ${validName}`
  const type = schema
    ? 'type' in schema && schema.type === 'file'
      ? 'File'
      : schemaToType(schema, comment, multiline)
    : 'unknown'

  return { entry, tuple: `${doc}${label}: ${type}` }
}

export const parametersToTuples = (parameters: Parameter[], comment?: boolean) => {
  const ret: Record<Parameter['in'], ReturnType<typeof parameterToTuple>[]> = {
    query: [], header: [], formData: [], path: [], body: [], cookie: [],
  }
  parameters.forEach(x => ret[x.in].push(parameterToTuple(x, comment)))
  return ret
}

export type ParametersToSchema<T extends Parameter> = {
  type: 'object';
  properties: { [P in T as P['name']]:
    P extends { type: string } ? P : Get<P, 'schema'> };
  required: Array<T extends { required: true } ? T['name'] : never>;
}

/**
 * Converts an array of parameters into a schema object.
 *
 * @param parameters - The array of parameters to convert.
 * @returns The JSON Schema Object representing the parameters.
 */
export const parametersToSchemaObject = <T extends Parameter[]>(parameters: T) => ({
  type: 'object',
  properties: Object.fromEntries(parameters.flatMap(x =>
    'schema' in x ? [[x.name, x.schema]] : isJsonSchema(x) ? [[x.name, x]] : [])),
  required: parameters.filter(x => x.required).map(x => x.name),
} as const) as ParametersToSchema<T[number]>
