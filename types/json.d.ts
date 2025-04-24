declare module '*.json' {
  interface ApiResponse {
    code: number
    info: string
    request_id: string
    banner_id: string
    data: {
      title: string[]
      datas: [string, string][]
      end: boolean
    }
  }
  const value: ApiResponse[]
  export default value
}
