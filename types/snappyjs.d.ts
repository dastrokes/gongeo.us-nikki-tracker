declare module 'snappyjs' {
  export function uncompress(data: Uint8Array): Uint8Array
  export function compress(data: Uint8Array): Uint8Array
}
