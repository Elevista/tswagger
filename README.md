# TSwagger

TS-Swagger plugin generator CLI  
CLI to generate Axios or other API client from Swagger schema

[![npm package](https://img.shields.io/npm/v/tswagger.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/tswagger)
[![github stars](https://img.shields.io/github/stars/Elevista/tswagger?style=social)](https://github.com/Elevista/tswagger)

## Installation

```sh
npm i -D tswagger
```

## Basic Usage

in project directory

```sh
npx tswagger https://petstore3.swagger.io/api/v3/openapi.json
```

in script code

```js
import { createApi } from './lib/api'
const api = createApi()
const foo = await api.foo.bar(1).post(requestBody) // Post /foo/{bar} 
api.foo.bar.get() // GET /foo/bar
```

### Use fetch or other request library

```sh
npx tswagger https://api.server.foo/swagger.json --mode request
```

```js
import { createApi } from './lib/api'
const fetchApi = createApi((path, method, { params, formData, body }) => {
  const url = new URL(`http://localhost${path}`)
  // url.search = qs.stringify(params, { arrayFormat: 'brackets' })
  return fetch(url, {
    method,
    body: formData ?? (body && JSON.stringify(body)),
  })
}, response => {
  if (response.status >= 400) throw new Error(...)
  return response.json()
})
const {data} = await fetchApi.foo.bar(1).get(2) // GET /foo/{bar} 
fetchApi.foo.bar.get() // GET /foo/bar


import axios, { AxiosError } from 'axios'
const axiosApi = createApi((path, method, { params, formData, body }) =>
  axios({ url: path, method, params, data: formData ?? body }),
  response => response.data)
const {data} = axiosApi.foo.bar(1).get(2)
```

## Options

```sh
npx tswagger argument1 --option1 value1 --option2 value2
```

| option           | description                | default                                  | example                             |
|------------------|----------------------------|------------------------------------------|-------------------------------------|
| (first argument) | Swagger schema JSON path   | (required)                               | `http://..` or `./foo/swagger.json` |
| `src`            | same as first argument     | first argument                           | same as above                       |
| `mode`           | Code generation mode       | `axios`                                  | `request`                           |
| `path`           | Output path                | `lib/api`                                | `api.ts`                            |
| `export-name`    | Export name                | `createApi`                              | `''`(export default)                |
| `type-path`      | Path for scheme type file  | `{dir of path}/types.ts`                 | `./types/models.ts`                 |
| `tag`            | Tags to generate           | (All tags)                               | `--tag AA --tag BB`                 |

### Options from file

Options can be an array

#### `tswagger.config.js`

```js
// import { TSwaggerOptions } from 'tswagger'
export default { src: '...' } // satisfies Partial<TSwaggerOptions>
```

#### `package.json`

```json
{
  "tswagger": {
    "src": "..."
  }
}
```

## Intentionally Limited Support

TSwagger supports only a subset of the OpenAPI / JSON Schema spec on purpose. The scope is based on what Spring ([springdoc-openapi](https://springdoc.org)) and NestJS ([@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)) generate.

### API generation

- HTTP methods: only `get`, `post`, `put`, `patch`, `delete`. `head`, `options` are skipped.
- Parameters: `header` and `cookie` parameters are ignored.
- Parameter `style`, `content` are not supported.
- Request body: only `application/json` and `multipart/form-data`.
- Response and error: only `application/json` is used. Responses with other content types are typed as `unknown`.
- Swagger 2.0: response and error types are not generated (typed as `unknown`).
- `$ref`: only local references. External references are not supported.

### Type generation

- `type`
  - `properties` / `items` are used only with `type: 'object'` / `type: 'array'`.
  - `type` array is supported only in the `[type, 'null']` form (either order), as another way to write `nullable: true`. In other forms such as `['string', 'number']`, only the first non-`null` type is used.
- `format`: only `binary` and `byte` are used (as `File`). Other formats are ignored.
- `allOf` / `oneOf` / `anyOf`
  - Only one is used when combined, in order of `allOf` → `oneOf` → `anyOf`.
  - `anyOf`: more than 4 `$ref`s, or any schema other than primitives and `$ref`s, become `Partial<A & B & ...>`.
    - `const` without `type` is not treated as a primitive schema here, so it ends up in `Partial<A & B & ...>`.
- Keywords next to `$ref` are ignored, except `nullable`.
- `additionalProperties: true` or `{}` is ignored.
- Excluded: `prefixItems`, `patternProperties`, `not`, `discriminator`, `readOnly`, `writeOnly`, and validation keywords such as `minimum`, `maxLength`, `pattern`, `minItems`.
- TSDoc: only the values of `examples` are written.

### Spring / NestJS reference

Schema features Spring and NestJS can generate that TSwagger limits or excludes.

| Feature             | Spring                                | NestJS                                   | TSwagger                                  |
|---------------------|---------------------------------------|------------------------------------------|-------------------------------------------|
| `type` array        | `types = {"string", "null"}` (3.1)    | `type?: string \| string[]`              | `[type, 'null']` form only (either order) |
| `patternProperties` | `patternProperties` (3.1)             | Available                                | Excluded                                  |
| `prefixItems`       | `prefixItems` (3.1)                   | Not available                            | Excluded                                  |
| `discriminator`     | `discriminatorProperty` / `Mapping`   | `discriminator`                          | Excluded                                  |
| `not`, `readOnly`, `writeOnly` | Available                  | Available                                | Excluded                                  |

(3.1): Spring generates it only with `springdoc.api-docs.version=openapi_3_1`.

Sources: [swagger-core `@Schema`](https://github.com/swagger-api/swagger-core/blob/master/modules/swagger-annotations/src/main/java/io/swagger/v3/oas/annotations/media/Schema.java), [@nestjs/swagger `SchemaObject`](https://unpkg.com/@nestjs/swagger/dist/interfaces/open-api-spec.interface.d.ts), [NestJS types and parameters](https://docs.nestjs.com/openapi/types-and-parameters)

## License

ISC License
Copyright (c) 2023, Elevista
