/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types */
export type Writable<T> = {-readonly [P in keyof T]: T[P]}
export type Extends<T, U> = T extends U ? T : never
export type NotExtends<T, U> = T extends U ? never : T
export type RequireProps<Obj, Keys extends keyof Obj> = Obj & {[K in Keys]-?: Obj[K]}
export type PartialProps<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & {[K in Keys]?: Obj[K]}
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never
export type FilteredArray<T> = Exclude<T, any[]> | (Extract<T, any[]> extends Array<infer U> ? U[] : never)
export type WritableArray<T> = FilteredArray<Writable<T>>
export type HasProps<T, U extends string, V = unknown> = T extends {[key in U]?: V} ? T : never
export type PickProp<T, U extends string> = Exclude<HasProps<T, U>[U], undefined>
export type DeepPartial<T> = T extends any[] ? Array<DeepPartial<T[number]>> : T extends object ? {[K in keyof T]?: DeepPartial<T[K]>} : T | undefined
export type PromiseResult<T extends ((...args: any) => Promise<any>) | Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : T extends Promise<infer R> ? R : never

  type Key = string | number | symbol

export type Get<T, Path extends Key, _ = never> = Path extends `${infer Key}.${infer Rest}` ? Get<Get<T, Key>, Rest, _>
  : Path extends `${infer Key}[]`
  ? Get<T, Key, _> extends Array<infer U> ? U : _
  : T extends { [s in Path]?: infer U } ? U : _

export type Or<T, U> = T extends null | undefined | never
  ? U extends null | undefined | never ? never : U : T
