import type { PullRecord } from './pull'

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

export interface QueryResponse {
  code: number
  info: string
  request_id: string
  banner_id: number
  data: {
    title: string[]
    datas: PullRecord[]
    end: boolean
  }
}

export interface ApiError {
  code: number
  info: string
  request_id?: string
}
