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

export interface PearpalMagicBallItem {
  magic_ball_id: string | number
  magic_ball_color: string | number
}

// Deep-Sea Treasure Box reward for a Star Crown outfit
export interface PearpalClothRandomBoxItem {
  box_item_id: string
  card_pool_id: string
  reward_item_id: string
  reward_rarity: number
  suit_round: number
  suit_piece_index: number
}

export interface PearpalNoteBookResponse {
  info_from_gm?: {
    clothes?: Array<{
      item_id: number
      obtain_time: number
    }>
  }
  info_from_self: {
    gacha_list: PearpalTrackerItem[]
    suit_list?: Array<string | number>
    magic_ball_list?: PearpalMagicBallItem[]
    cloth_random_box_list?: PearpalClothRandomBoxItem[]
  }
}
