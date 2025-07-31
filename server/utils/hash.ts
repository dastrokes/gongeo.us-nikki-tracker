import { createHash } from 'crypto'

export async function hashUid(uid: string): Promise<string> {
  return createHash('sha256').update(uid).digest('hex')
}
