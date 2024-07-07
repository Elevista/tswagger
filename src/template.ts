export const promiseEt = `interface PromiseEt<T, E> extends Promise<T> {
  then<R1 = T, R2 = never>(onfulfilled?: ((value: T) => R1 | PromiseLike<R1>) | undefined | null, onrejected?: ((reason: E) => R2 | PromiseLike<R2>) | undefined | null): Promise<R1 | R2>;
  catch<R1 = never>(onrejected?: ((reason: E) => R1 | PromiseLike<R1>) | undefined | null): Promise<T | R1>;
}`

export const multipart = '$multipart'
export const multipartCode = `
const ${multipart} = (o: any) => {
  if (!(o instanceof Object)) return o
  const formData = new FormData()
  for (const [key, v] of Object.entries(o)) {
    const append = (v: any) => v !== undefined && formData.append(key, v instanceof Blob ? v : String(v))
    const files = (files: File | File[] | FileList) => {
      const list = files instanceof File ? [files] : files
      for (let i = 0; i < list.length; i++) formData.append(key, list[i], list[i].name)
    }
    if (v instanceof Array) v.forEach(item => (item instanceof File) ? files(item) : append(item))
    else if (v instanceof FileList || v instanceof File) files(v)
    else append(v)
  }
  return formData
}`
