import { fetch } from 'cross-fetch'
import { OpenAPI } from './spec/v3'
import { Swagger } from './spec/v2'
import fs from 'fs'
import p from 'path'
import c from 'chalk'
export default async function (path: string): Promise<OpenAPI | Swagger> {
  const isRemote = /^[a-z]+?:\/\//.test(path)
  if (!isRemote) return JSON.parse(fs.readFileSync(p.resolve(path)).toString())
  console.log(c.cyan(' ℹ fetching'), 'JSON from', c.underline(path))
  const res = await fetch(path)
  if (res.status >= 400) throw new Error('Fetch Error')
  return await res.json()
}
