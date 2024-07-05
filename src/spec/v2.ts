/* eslint-disable no-use-before-define */
import { Schema } from './schema'
export type MethodType = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'

export interface Swagger {
  swagger: '2.0';
  info: {title: string, description?: string, version: string,};
  paths: Paths
  definitions?: Record<string, Schema>
  // parameters?: Record<string, Parameter> // not support
  // responses?: Record<string, Response> // not support
  // securityDefinitions?: Record<string, unknown> // not support
  tags?: { name: string; description?: string; }[];
}

export type Paths = Record<string, PathItem>

export interface PathItem extends Record<MethodType, Operation | undefined> {
  summary?: string;
  description?: string;
}

export type Parameter = { name: string; description?: string; required?: boolean; } & (
  { in: 'body'; schema: Schema } | { in: 'formData', type: 'file' } |
  ({ in: 'query' | 'header' | 'path' } & (Schema & { type: 'string' | 'number' | 'integer' | 'boolean' | 'array'}))
)

export interface Operation {
  tags: string[];
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  responses: Responses;
  deprecated?: boolean;
}

export type Digit = 0|1|2|3|4|5|6|7|8|9
export type Responses = {[statusCode in `${2|3|4|5}${Digit}${Digit}` | 'default']?: Response}

export interface Response {
  description?: string;
  schema?: Schema;
  headers?: Record<string, Header>;
  examples: Example
}

export type Example = { 'application/json'?: unknown } | Record<`${string}/${string}`, unknown>

export type Header = Omit<Parameter, 'in' | 'name'>
