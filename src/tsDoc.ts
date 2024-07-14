import { Schema, isReference } from './spec/schema'
import { stringify } from 'javascript-stringify'

export const tsDocForm = (content?: string) => {
  if (!content) return ''
  content = content.replace(/\*\//, '*\\/')
  const multiline = content.includes('\n')
  const doc = content.replace(/\n/g, '\n * ')
  return multiline ? `/**\n * ${doc}\n */\n` : `/** ${doc} */\n`
}

export type DocProps = { summary?: string, description?: string, example?: unknown, default?: unknown } & object
export const tsDoc = ({ summary, description, example, default: defaults }: DocProps = {}) => tsDocForm([
  description || summary,
  description && summary && `@summary ${summary}`,
  example !== undefined && `@example ${stringify(example)}`,
  defaults !== undefined && `@default ${stringify(defaults)}`,
].filter(x => x).join('\n'))

export const docSchema = (schema: Schema) => isReference(schema) ? '' : tsDoc(schema as {})
