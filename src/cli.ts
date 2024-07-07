#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import fs from 'fs'
import { defaults, uniqBy } from 'lodash'
import * as mkdirp from 'mkdirp'
import c from 'chalk'
import fetchSpec from './fetchSpec'
import { notNullish } from './utils'
import { TSwaggerCliOptions as CliOptions, TSwaggerOptions as Options } from './index'
import { genAxiosCode } from './axios'
import { genTypeFile } from './schemaToType'
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { version } = require('../package.json')
try { require('ts-node').register() } catch (e) {}

interface Argv extends Partial<CliOptions> { _: [string?] }
const argvToOptions = ({ _: [$1], src = $1, ...rest }: Argv): Partial<CliOptions> => ({ src, ...rest })
const defaultOptions = ({
  src = '',
  pluginsDir = 'lib',
  pluginName = 'api',
  exportName = 'createApi',
  typePath = path.join(pluginsDir, pluginName, 'types.ts'),
  basePath = '/v1',
  skipHeader = false,
  form,
}: Partial<Options> = {}): Options => ({ src, pluginsDir, pluginName, exportName, typePath, basePath, skipHeader, form })

const loadConfig = async () => {
  try {
    const file = require(path.join(process.cwd(), './tswagger.config'))
    const config = file.default || file || []
    return [config].flat()
  } catch (e) {
    return []
  }
}

const optionFromJson = (): Partial<CliOptions> => {
  const ret: any = {}
  try {
    const jsonPath = path.join(process.cwd(), 'package.json')
    const { tswagger }: { tswagger: Partial<CliOptions> } = require(jsonPath)
    return tswagger
  } catch (e) { return ret }
}

const pluginRelTypePath = ({ pluginsDir, typePath, pluginName }: CliOptions) => {
  const { join, basename, dirname, relative } = path
  const sameDir = join(pluginsDir, pluginName) === dirname(typePath)
  const pluginPath = sameDir ? join(pluginsDir, pluginName, 'index.ts') : join(pluginsDir, `${pluginName}.ts`)
  const relTypePath = (sameDir ? `./${basename(typePath)}` : relative(dirname(pluginPath), typePath)).replace(/\.ts$/, '')
  return { pluginPath, relTypePath }
}

const makeDirs = ({ pluginsDir, typePath }: CliOptions) => {
  mkdirp.sync(pluginsDir)
  mkdirp.sync(path.dirname(typePath))
}

const generate = async (options: CliOptions) => {
  if (!options.src) throw new Error('No JSON path provided')
  const spec = await fetchSpec(options.src)
  makeDirs(options)

  const { pluginPath, relTypePath } = pluginRelTypePath(options)
  const schemas = ('openapi' in spec ? spec.components?.schemas : 'swagger' in spec ? spec.definitions : {}) || {}

  fs.writeFileSync(options.typePath, genTypeFile(schemas))
  console.log(c.blue(' ✔ create  '), options.typePath)
  fs.writeFileSync(pluginPath, genAxiosCode(spec.paths, relTypePath, schemas, options.exportName))
  console.log(c.green(' ✔ create  '), pluginPath)
}

const run = async function () {
  console.log(c.bold(c.bgBlue.white('TS') + c.cyan('wagger')), c.gray(`(v${version})`))
  const { argv }: { argv: Argv } = yargs(hideBin(process.argv))
  const cliOption = argvToOptions(argv)
  const jsonOption = optionFromJson()
  const configOptions = await loadConfig()
  let partialOptions = [configOptions, cliOption, jsonOption].flat().filter(notNullish)
  if (cliOption.pluginName || cliOption.src) {
    const { pluginName } = defaultOptions()
    partialOptions = partialOptions.filter(x => (x.pluginName || pluginName) === (cliOption.pluginName || pluginName))
  }
  let options = uniqBy(partialOptions.map(option => defaultOptions(defaults({}, cliOption, option, jsonOption)))
    , x => x.pluginName)
  if (options.filter(x => x.src).length) options = options.filter(x => x.src)

  for (const option of options) await generate(option)
}
run()
