/* eslint-disable no-use-before-define */
import { Reference, Schema, SchemaObject } from './schema'
export type MethodType = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'

export interface OpenAPI {
  openapi: `3.${string}`;
  info: {title: string, summary?: string, description?: string, version: string};
  servers?: unknown;
  paths: Paths;
  components?: Components;
  tags?: {name: string;description?: string;}[];
}

export interface Components {
  schemas: Record<string, Schema>;
  // responses?: Record<string, Response | Reference>; // not support
  // parameters?: Record<string, Parameter | Reference>; // not support
  // examples?: Record<string, Example | Reference>; // not support
  // requestBodies?: Record<string, RequestBody | Reference>; // not support
  // headers?: Record<string, Header | Reference> // not support
}
export type Paths = Record<string, PathItem>

export interface PathItem extends Record<MethodType, Operation | undefined> {
  summary?: string;
  description?: string;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  // style?: 'form' | 'simple' | 'matrix' | 'label' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'; // not support
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, Example | Reference>;
  // content?: Record<`${string}/${string}`, MediaType | undefined>; // not support
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: { 'application/json'?: MediaType, 'multipart/form-data'?: Omit<MediaType, 'schema'> & { schema: SchemaObject } };
}

export interface MediaType {
  examples?: {[param in string]?: Example};
  schema?: Schema;
}

export interface Operation {
  tags: string[];
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Responses;
  deprecated?: boolean;
}

export type Digit = 0|1|2|3|4|5|6|7|8|9
export type Responses = {[statusCode in `${2|3|4|5}${Digit}${Digit}` | 'default']?: Response}

export interface Response {
  description?: string;
  content: { 'application/json'?: MediaType, 'multipart/form-data'?: Omit<MediaType, 'schema'> & { schema: SchemaObject } };
  headers?: Record<string, Header>;
}

export interface Example {
  summary?: string;
  description?: string;
  value?: unknown;
}

export type Header = Omit<Parameter, 'in' | 'name'>
