import { createClient } from '@supabase/supabase-js'

export interface UserBannerStats extends Record<string, unknown> {
  uid: string
  banner_id: number
  banner_type: number
  total_pulls: number
  total_4star_items: number
  total_5star_items: number
  total_4star_only_items: number
  avg_4star_pulls: number
  avg_5star_pulls: number
  avg_4star_only_pulls: number
  last_pull_time: string | null
  first_4star_item_id: string | null
  first_5star_item_id: string | null
  updated_at: string
}

/*
CREATE TABLE user_banner_stats (
  uid TEXT NOT NULL,
  banner_id INTEGER NOT NULL,
  banner_type INTEGER NOT NULL,
  total_pulls INTEGER NOT NULL,
  total_4star_items INTEGER NOT NULL,
  total_5star_items INTEGER NOT NULL,
  total_4star_only_items INTEGER NOT NULL,
  avg_4star_pulls NUMERIC NOT NULL,
  avg_5star_pulls NUMERIC NOT NULL,
  avg_4star_only_pulls NUMERIC NOT NULL,
  last_pull_time TIMESTAMP WITH TIME ZONE,
  first_4star_item_id TEXT,
  first_5star_item_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (uid, banner_id)
);
*/

// Create a singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

const createSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  const config = useRuntimeConfig()
  supabaseInstance = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    }
  )

  return supabaseInstance
}

export const useUserBannerStats = () => {
  const sendUserBannerStats = async (data: UserBannerStats) => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.from('user_banner_stats').upsert(data, {
        onConflict: 'uid,banner_id',
        ignoreDuplicates: false,
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error sending to user_banner_stats:', error)
      return false
    }
  }

  return {
    sendUserBannerStats,
  }
}
