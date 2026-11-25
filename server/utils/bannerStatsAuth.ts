const forbidden = () =>
  createError({ statusCode: 403, statusMessage: 'Forbidden - invalid' })

export const verifyStatsUser = async (
  header: string,
  deadline: AbortSignal
) => {
  const token = /^Bearer (\S+)$/i.exec(header)?.[1]
  if (!token) throw forbidden()
  deadline.throwIfAborted()
  let abort: (() => void) | undefined
  try {
    const expired = new Promise<never>((_resolve, reject) => {
      abort = () => reject(deadline.reason)
      deadline.addEventListener('abort', abort, { once: true })
    })
    const { data, error } = await Promise.race([
      useSupabaseServerClient().auth.getUser(token),
      expired,
    ])
    if (error && isTransientSupabaseError(error)) throw error
    if (error || !data.user) throw forbidden()
    return data.user.id
  } finally {
    if (abort) deadline.removeEventListener('abort', abort)
  }
}
