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
import { setAxios, api } from './api'
import axios from 'axios'
setInstance(axios.create({ baseURL: 'http://localhost:8080', timeout: 100 })) // optional
const foo = await api.bar.get()
```

### Path param mode

*see `form` option*

```js
/* default (1.1.0+) */
api.foo.bar(1).get(2)
api.foo.bar.get()

/* underscore */
api.foo._bar.get(1, 2)
api.foo.bar.get()
```

## Options

options priority : command line > `tswagger.config` > `package.json`

```sh
tswagger argument1 --option1 value1 --option2 value2
```

| option           | description                | default                                  | example                             |
|------------------|----------------------------|------------------------------------------|-------------------------------------|
| (first argument) | Swagger schema JSON path   | (required)                               | `http://..` or `./foo/swagger.json` |
| `src`            | same as first argument     | first argument                           | same as above                       |
| `plugins-dir`    | Directory                  | `lib`                                    |                                     |
| `plugin-name`    | Name for generated flile   | `api`                                    |                                     |
| `export-name`    | Export name                | `{plugin-name}`                          | `''`(export default)                |
| `type-path`      | Path for scheme type file  | `{plugins-dir}/{plugin-name}/{types.ts}` | `./types/models.ts`                 |
| `base-path`      | base path                  | `/v1`                                    | `/v2`                               |
| `skip-header`    | Ignore parameter in header | `false`                                  | `true`                              |
| `form`           | Path param interface mode  | (undefined)                              | `underscore`                        |

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
