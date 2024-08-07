export * from './traversePaths'
export * from './parametersToTuples'
export * from './schemaToType'
export { toValidName, escapeProp, variableBoundary, brace } from './utils'
export { tsDoc, docSchema, tsDocForm } from './tsDoc'
export * as template from './gen/template'
export * as schema from './spec/schema'
export type * as v2 from './spec/v2'
export type * as v3 from './spec/v3'
export * from './typeOperation'

export interface TSwaggerCliOptions {
  src: string
  path: string
  exportName: string
  typePath: string
  mode: 'axios' | 'request'
  tag?: string | string[]
}
export type TSwaggerOptions = TSwaggerCliOptions
