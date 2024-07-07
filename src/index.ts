export * from './traversePaths'
export * from './parametersToTuples'
export * from './schemaToType'
export { toValidName, toSafeKey, variableBoundary, brace } from './utils'
export { tsDoc, docSchema, tsDocForm } from './tsDoc'
export * as template from './template'
export * as schema from './spec/schema'
export type * as v2 from './spec/v2'
export type * as v3 from './spec/v3'
export * from './typeOperation'

export interface TSwaggerCliOptions {
  src: string
  pluginsDir: string
  pluginName: string
  exportName: string
  typePath: string
  basePath: string
  skipHeader: boolean
  mode: 'axios' | 'request'
  form?: undefined
}
export type TSwaggerOptions = TSwaggerCliOptions
