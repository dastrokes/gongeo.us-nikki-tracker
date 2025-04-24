export interface CookieData {
  roleid: string
  token: string
  id: string
}

export interface VerifyResponse {
  code: number
  info: string
  request_id: string
  data: string
}

export interface GachaRecord {
  time: string
  GachaResult: string
}

export interface QueryResponse {
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

export interface ApiError {
  code: number
  info: string
  request_id?: string
}
