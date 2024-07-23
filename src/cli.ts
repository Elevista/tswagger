#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path'
import fs from 'fs'
import * as mkdirp from 'mkdirp'
import c from 'chalk'
import fetchSpec from './fetchSpec'
import { TSwaggerOptions as Options } from './index'
import { genAxiosCode } from './gen/axios'
import { genTypeFile } from './schemaToType'
import { genRequestCode } from './gen/request'
const { join: pathJoin, dirname, relative, extname, resolve } = path
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { version } = require('../package.json')
try { require('ts-node').register() } catch (e) {}

interface Argv extends Partial<Options> { _: [string?], $0: unknown }
const argvToOptions = ({ _: [$1], $0: _, src = $1, ...rest }: Argv): Partial<Options> => (src ? { src, ...rest } : rest)
const defaultOptions = ({
  src = '',
  path = 'lib/api',
  exportName = 'createApi',
  typePath = pathJoin(path, extname(path) ? '..' : '.', 'types.ts'),
  mode = 'axios',
  tag = undefined,
}: Partial<Options> = {}): Options => ({ src, path, exportName, typePath, mode, tag })

const optionsFromConfig = (): Partial<Options>[] => {
  try {
    const file = require(path.join(process.cwd(), './tswagger.config'))
    return [file.default || file || []].flat()
  } catch (e) { return [] }
}

const optionsFromJson = () => {
  try {
    const jsonPath = path.join(process.cwd(), 'package.json')
    const { tswagger }: { tswagger: Partial<Options> } = require(jsonPath)
    return [tswagger || []].flat()
  } catch (e) { return [] }
}

const makeDirs = ({ path, typePath }: Options) => {
  mkdirp.sync(dirname(path))
  mkdirp.sync(dirname(typePath))
}

const generate = async (options: Options) => {
  if (!options.src) throw new Error('No JSON path provided')
  const spec = await fetchSpec(options.src)
  makeDirs(options)

  const { tag = [], typePath, mode, exportName } = options
  const path = pathJoin(extname(options.path)
    ? options.path
    : resolve(options.path) === dirname(resolve(typePath))
      ? pathJoin(options.path, 'index.ts')
      : `${options.path}.ts`, '.')
  let relTypePath = relative(dirname(resolve(path)), resolve(typePath)).replace(/\.ts$/, '')
  if (!relTypePath.startsWith('.')) relTypePath = `./${relTypePath}`
  const tags = [tag].flat()
  const schemas = ('openapi' in spec ? spec.components?.schemas : 'swagger' in spec ? spec.definitions : {}) || {}

  const code = (mode === 'request' ? genRequestCode : genAxiosCode)(spec.paths, relTypePath, schemas, exportName, tags)
  fs.writeFileSync(path, code)
  console.log(c.green(' ✔ create  '), path)
  fs.writeFileSync(typePath, genTypeFile(schemas, tags.length ? code : undefined))
  console.log(c.blue(' ✔ create  '), typePath)
}

const run = async function () {
  console.log(c.bold(c.bgBlue.white('TS') + c.cyan('wagger')), c.gray(`(v${version})`))
  const { argv }: { argv: Argv } = yargs(hideBin(process.argv))
  const cliOption = argvToOptions(argv)
  const jsonOption = optionsFromJson()
  const configOptions = optionsFromConfig()
  for (let i = 0; i < Math.max(jsonOption.length, configOptions.length, 1); i++) {
    await generate(defaultOptions({
      ...jsonOption[i],
      ...configOptions[i],
      ...cliOption,
    }))
  }
}
run()
