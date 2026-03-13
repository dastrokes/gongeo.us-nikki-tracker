export const useVoterFingerprint = () => {
  const voterFingerprint = useState<string | null>(
    'voter-fingerprint',
    () => null
  )
  const isFingerprintInitialized = useState<boolean>(
    'voter-fingerprint-initialized',
    () => false
  )

  const isFingerprintFallback = computed(() => {
    return voterFingerprint.value?.startsWith('fallback-') ?? false
  })

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

  const initVoterFingerprint = async () => {
    if (isFingerprintInitialized.value || !import.meta.client) return

    try {
      // Try to get from localStorage first
      const stored = localStorage.getItem('gongeous-voter-fingerprint')
      if (stored) {
        voterFingerprint.value = stored
        isFingerprintInitialized.value = true
        return
      }

      // Generate new fingerprint
      const fingerprint = await generateVoterFingerprint()
      voterFingerprint.value = fingerprint
      localStorage.setItem('gongeous-voter-fingerprint', fingerprint)
      isFingerprintInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize fingerprint:', error)
      // Use fallback
      const fallback =
        'fallback-' +
        Date.now().toString() +
        '-' +
        Math.random().toString(36).substring(7)
      voterFingerprint.value = fallback
      localStorage.setItem('gongeous-voter-fingerprint', fallback)
      isFingerprintInitialized.value = true
    }
  }

  return {
    voterFingerprint: readonly(voterFingerprint),
    isFingerprintInitialized: readonly(isFingerprintInitialized),
    isFingerprintFallback,
    initVoterFingerprint,
    generateVoterFingerprint,
  }
}
