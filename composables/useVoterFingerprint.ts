/**
 * Generate a fingerprint for anonymous voting using FingerprintJS
 * This provides a more reliable and accurate browser fingerprint
 */
export const useVoterFingerprint = () => {
  const generateVoterFingerprint = async (): Promise<string> => {
    if (typeof window === 'undefined') {
      return 'server-' + Date.now().toString()
    }

    try {
      const FingerprintJS = await import('@fingerprintjs/fingerprintjs')
      const fp = await FingerprintJS.load()
      const result = await fp.get()
      return result.visitorId
    } catch (error) {
      console.error('Failed to generate fingerprint:', error)
      // Fallback to timestamp-based ID
      return (
        'fallback-' +
        Date.now().toString() +
        '-' +
        Math.random().toString(36).substring(7)
      )
    }
  }

  return {
    generateVoterFingerprint,
  }
}
