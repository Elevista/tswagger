export * from './utils'
export { default as V2T } from './schema/v2/Template'
export { default as V3T } from './schema/v3/Template'
export { Spec as V2spec } from './schema/v2/Spec'
export { Spec as V3spec } from './schema/v3/Spec'
export { TemplateOptions, TemplateCommon } from './TemplateCommon'
export { default as fetchSpec } from './fetchSpec'
export interface TSwaggerCliOptions {
  src: string
  pluginsDir: string
  pluginName: string
  exportName: string
  typePath: string
  basePath: string
  skipHeader: boolean
  form?: 'underscore'
}
export type TSwaggerOptions = TSwaggerCliOptions
