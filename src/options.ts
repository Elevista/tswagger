export interface CliOptions {
  src: string
  pluginsDir: string
  pluginName: string
  exportName: string
  typePath: string
  basePath: string
  skipHeader: boolean
  form?: 'underscore'
}
export type Options = CliOptions
