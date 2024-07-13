import { Parameter as ParameterV2 } from './spec/v2'
import { Parameter as ParameterV3 } from './spec/v3'
import { escapeProp, toValidName } from './utils'
import { schemaToType } from './schemaToType'
import { tsDoc } from './tsDoc'
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

export const parameterToTuple = (x: ParameterV2 | ParameterV3, comment?: boolean): TupleInfo => {
  const schema = 'type' in x ? x : x.schema
  const validName = toValidName(x.name)
  const doc = comment ? tsDoc(schema) : ''
  const [name, label] = [x.name, `${validName}${(x.required || x.in === 'path') ? '' : '?'}`]
  const entry = name === validName ? name : `${escapeProp(name)}: ${validName}`
  const type = schema
    ? 'type' in schema && schema.type === 'file'
      ? 'File'
      : schemaToType(schema, false, false)
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
