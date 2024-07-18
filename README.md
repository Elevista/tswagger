# TSwagger

TS-Swagger plugin generator CLI

[![npm package](https://img.shields.io/npm/v/tswagger.svg?maxAge=2592000&style=flat-square)](https://www.npmjs.com/package/tswagger)
[![github stars](https://img.shields.io/github/stars/Elevista/tswagger?style=social)](https://github.com/Elevista/tswagger)

## Installation

```sh
npm i -D tswagger
```

## Basic Usage

in project directory

```sh
npx tswagger https://api.server.foo/swagger.json
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

options priority : command line > `tswagger.config` > `package.json`

```sh
npx tswagger argument1 --option1 value1 --option2 value2
```

| option           | description                | default                                  | example                             |
|------------------|----------------------------|------------------------------------------|-------------------------------------|
| (first argument) | Swagger schema JSON path   | (required)                               | `http://..` or `./foo/swagger.json` |
| `src`            | same as first argument     | first argument                           | same as above                       |
| `mode`           | Code generation mode       | `axios`                                  | `request`                           |
| `plugins-dir`    | Directory                  | `lib`                                    |                                     |
| `plugin-name`    | Name for generated flile   | `api`                                    |                                     |
| `export-name`    | Export name                | `createApi`                              | `''`(export default)                |
| `type-path`      | Path for scheme type file  | `{plugins-dir}/{plugin-name}/{types.ts}` | `./types/models.ts`                 |
| `tag`            | Tags to generate           | (All tags)                               | `--tag AA --tag BB`                 |

### Set options using `tswagger.config`

```ts
import { TSwaggerOptions } from 'tswagger'

const option: Partial<TSwaggerOptions> = {
  pluginName: 'foo'
}

export default option
```

### Set options using `package.json`

```json
{
  "tswagger": {
    "pluginsDir": "api"
  }
}
```

#### `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["tswagger/types"]
  }
}
```

and `npm run swagger` or `npx tswagger`

## License

ISC License
Copyright (c) 2023, Elevista
