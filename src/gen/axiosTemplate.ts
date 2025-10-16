import { multipart, multipartCode, promiseEt } from './template'
import { variableBoundary } from '../utils'

export const promiseWrapper = `${promiseEt}
type $P<R, E> = PromiseEt<R, AxiosError<E>> & { readonly response: PromiseEt<AxiosResponse<R>, AxiosError<E>> }`

export const axiosArrowCode = (responseType: string, errorType: string, tuples: string, methodType: string, args: string[]) =>
   `<$R = ${responseType}, $E = ${errorType}>${tuples}: $P<$R, $E> => _(${[`'${methodType}'`, ...args].join(', ')})`

export const exportCode = (exportName: string, axiosCode: string) => `
const $ep = (_: any) => (${axiosCode})\n
export ${exportName ? `const ${exportName} =` : 'default'} ($axios = Axios.create($axiosConfig)) => $ep((method: string, ...args: any) => 
  new Proxy(($axios as any)[method](...args),{get:(p,k)=>k==='response'?p:/^(then|catch|finally)$/.test(String(k))?(...a:any)=>p.then((x:any)=>x?.data)[k](...a):p[k]}))`

export const importTypes = (refTypes: string[], refPath: string) => refTypes.length ? `import { ${refTypes.join(', ')} } from '${refPath}'` : ''

export const apiFile = (objectCode: string, refTypes: string[], refPath: string, exportName = '') => `/* eslint-disable */
import Axios, { AxiosStatic, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
${importTypes(refTypes, refPath)}
${promiseWrapper}
export const $axiosConfig: Required<Parameters<AxiosStatic['create']>>[0] = {}
${exportCode(exportName, objectCode)}
${variableBoundary(multipart).test(objectCode) ? multipartCode : ''}
`
