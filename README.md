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
  const url.searchParams = (...)
  return fetch(url, {
    method,
    body: formData ?? body ?? JSON.stringify(body),
  })
}, response => response.json())
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

## License

ISC License
Copyright (c) 2023, Elevista
