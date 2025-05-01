import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    // Get the request body
    const body = await readBody(event)

    // Validate the request body
    if (!Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid request body - expected array of banner stats',
      })
    }

    const config = useRuntimeConfig()

    // Create Supabase client with service role key (secure server-side only)
    const supabase = createClient(
      config.supabaseUrl as string,
      config.supabaseServiceKey as string,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Hash UIDs server-side
    const hashedDataPromises = body.map(async (item) => ({
      ...item,
      uid: await hashUid(item.uid),
    }))
    const hashedData = await Promise.all(hashedDataPromises)

    const { error } = await supabase
      .from('user_banner_stats')
      .upsert(hashedData, {
        onConflict: 'uid,region,banner_id',
        ignoreDuplicates: false,
      })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error sending to banner_stats:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update banner stats',
    })
  }
})

// Move hashUid to server-side
const hashUid = async (uid: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(uid)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
