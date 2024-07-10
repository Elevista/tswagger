import { multipart, multipartCode, promiseEt } from './template'
import { variableBoundary } from './utils'

export const promiseWrapper = `export interface $customExtendResponse {}
${promiseEt}
type $P<R, E> = PromiseEt<R, E> & { readonly response: PromiseEt<AxiosResponse<R> & $customExtendResponse, AxiosError<E>> }`

export const axiosArrowCode = (responseType: string, errorType: string, tuples: string[], methodType: string, args: string[]) =>
   `<$R = ${responseType}, $E = ${errorType}>(${tuples.join(', ')}): $P<$R, $E> => _(${[`'${methodType}'`, ...args].join(', ')})`

export const exportCode = (exportName: string, axiosCode: string) => `
const $ep = (_: any) => (${axiosCode})\n
export ${exportName ? `const ${exportName} =` : 'default'} ($axios = Axios.create($axiosConfig)) => $ep((method: string, ...args: any) => {
  const promise = ($axios as any)[method](...args)
  return Object.defineProperty(promise.then((x: any) => x.data), 'response', {value: promise})
})`

export const importTypes = (refTypes: string[], refPath: string) => `import { ${refTypes.join(', ')} } from '${refPath}'`

export const apiFile = (objectCode: string, refTypes: string[], refPath: string, exportName = '') => `/* eslint-disable */
import Axios, { AxiosStatic, AxiosResponse, AxiosError } from 'axios'
${importTypes(refTypes, refPath)}
${promiseWrapper}
export const $axiosConfig: Required<Parameters<AxiosStatic['create']>>[0] = {}
${exportCode(exportName, objectCode)}
${variableBoundary(multipart).test(objectCode) ? multipartCode : ''}
`
