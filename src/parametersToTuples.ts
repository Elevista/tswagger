import { Parameter as ParameterV2 } from './spec/v2'
import { Parameter as ParameterV3 } from './spec/v3'
import { toValidName } from './utils'
import { schemaToType } from './schemaToType'
export type Parameter = ParameterV2 | ParameterV3

export type TupleInfo = {
  /** The original name of the parameter. */
  name: string
  /** The typescript type of the parameter. */
  type: string
  /** The valid javascript variable name */
  validName: string
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

export const parameterToTuple = (x: ParameterV2 | ParameterV3): TupleInfo => {
  const schema = 'type' in x ? x : x.schema
  const validName = toValidName(x.name)
  const [name, label] = [x.name, `${validName}${(x.required || x.in === 'path') ? '' : '?'}`]
  const entry = name === validName ? name : `${name}: ${validName}`
  const type = schema
    ? 'type' in schema && schema.type === 'file'
      ? 'File'
      : schemaToType(schema, false, '')
    : 'unknown'

  return { name, type, validName, entry, tuple: `${label}: ${type}` }
}

export const parametersToTuples = (parameters: Parameter[]) => {
  const ret: Record<Parameter['in'], ReturnType<typeof parameterToTuple>[]> = {
    query: [], header: [], formData: [], path: [], body: [], cookie: [],
  }
  parameters.forEach(x => ret[x.in].push(parameterToTuple(x)))
  return ret
}
