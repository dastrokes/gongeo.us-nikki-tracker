import type { PullRecord, PearpalTrackerItem } from './pull'

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

export interface PearpalUserInfoResponse {
  code: number
  info: string
  data: {
    role: {
      uid: number
      zone_id: number
    }
  }
}

export interface PearpalNoteBookResponse {
  info_from_self: {
    gacha_list: PearpalTrackerItem[]
  }
}
