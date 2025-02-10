import { fetch } from 'cross-fetch'
import { OpenAPI } from './spec/v3'
import { Swagger } from './spec/v2'
import fs from 'fs'
import p from 'path'
import c from 'chalk'
import * as YAML from 'yaml'
export default async function (path: string): Promise<OpenAPI | Swagger> {
  const isRemote = /^[a-z]+?:\/\//.test(path)
  const isYaml = /\.ya?ml$/.test(path)
  if (!isRemote) {
    const file = fs.readFileSync(p.resolve(path)).toString()
    return isYaml ? YAML.parse(file) : JSON.parse(file)
  }
  console.log(c.cyan(' ℹ fetching'), `${isYaml ? 'YAML' : 'JSON'} from`, c.underline(path))
  const res = await fetch(path)
  if (res.status >= 400) throw new Error('Fetch Error')
  return isYaml ? YAML.parse(await res.text()) : res.json()
}
