export interface StorageItem<T> {
  value: T
  expiry: number
}

export const setWithExpiry = <T>(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000) => {
  const item: StorageItem<T> = {
    value: value,
    expiry: new Date().getTime() + ttl,
  }
  try {
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error(`Failed to set localStorage key "${key}":`, error)
    throw error
  }
}

export const getWithExpiry = <T>(key: string): T | null => {
  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr) as StorageItem<T>
    
    // Validate the shape of parsed data
    if (!item || typeof item !== 'object' || !('value' in item) || !('expiry' in item)) {
      console.warn(`Invalid data structure in localStorage for key "${key}"`)
      localStorage.removeItem(key)
      return null
    }

    const now = new Date().getTime()
    if (now > item.expiry) {
      localStorage.removeItem(key)
      return null
    }
    
    return item.value
  } catch (error) {
    console.error(`Failed to parse localStorage key "${key}":`, error)
    localStorage.removeItem(key) // Clean up invalid data
    return null
  }
}

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove localStorage key "${key}":`, error)
    throw error
  }
}

export const cleanupExpiredItems = (): void => {
  try {
    const now = new Date().getTime()
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      const itemStr = localStorage.getItem(key)
      if (!itemStr) continue

      try {
        const item = JSON.parse(itemStr) as StorageItem<unknown>
        if (item && typeof item === 'object' && 'expiry' in item && now > item.expiry) {
          localStorage.removeItem(key)
        }
      } catch {
        // Skip invalid items
        continue
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired items:', error)
    throw error
  }
} 