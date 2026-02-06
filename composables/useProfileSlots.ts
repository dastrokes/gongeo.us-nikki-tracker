export interface ProfileSlot {
  label: string
  exists: boolean
  lastSyncAt: string | null
}

export const MAX_PROFILES = 3
const STORAGE_KEY = 'gongeous-profile-slots'
const DEFAULT_PROFILE_LABEL = 'Default'
const PROFILE_LABEL_PREFIX = 'Profile '

type StoredProfileState = {
  slots: ProfileSlot[]
  active: number
}

const DEFAULT_SLOTS: ProfileSlot[] = [
  { label: DEFAULT_PROFILE_LABEL, exists: true, lastSyncAt: null },
  { label: `${PROFILE_LABEL_PREFIX}2`, exists: false, lastSyncAt: null },
  { label: `${PROFILE_LABEL_PREFIX}3`, exists: false, lastSyncAt: null },
]

const createDefaultSlots = (): ProfileSlot[] =>
  DEFAULT_SLOTS.map((slot) => ({ ...slot }))

const isDefaultLabel = (slot: number, label?: string): boolean => {
  if (!label) return true
  const normalized = label.trim()
  if (slot === 1) {
    return normalized === DEFAULT_PROFILE_LABEL
  }
  return normalized === `${PROFILE_LABEL_PREFIX}${slot}`
}

const normalizeSlots = (slots: ProfileSlot[]): ProfileSlot[] => {
  const normalized: ProfileSlot[] = []
  for (let i = 0; i < MAX_PROFILES; i++) {
    const slot = slots[i]
    if (!slot) {
      normalized.push({ ...DEFAULT_SLOTS[i]! })
      continue
    }
    const label =
      typeof slot.label === 'string' && slot.label.trim().length > 0
        ? slot.label
        : DEFAULT_SLOTS[i]!.label
    const lastSyncAt =
      typeof slot.lastSyncAt === 'string' ? slot.lastSyncAt : null
    const exists = i === 0 ? true : !!slot.exists
    normalized.push({ label, exists, lastSyncAt })
  }
  return normalized
}

const normalizeActiveSlot = (slot: number, slots: ProfileSlot[]): number => {
  const normalized = Number.isFinite(slot) ? slot : 1
  if (normalized < 1 || normalized > MAX_PROFILES) return 1
  if (!slots[normalized - 1]?.exists) {
    const firstExisting = slots.findIndex((s) => s.exists)
    return firstExisting >= 0 ? firstExisting + 1 : 1
  }
  return normalized
}

const loadProfileStateFromStorage = (): StoredProfileState => {
  if (!import.meta.client) {
    return { slots: createDefaultSlots(), active: 1 }
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { slots: createDefaultSlots(), active: 1 }
  }
  try {
    const parsed = JSON.parse(raw) as StoredProfileState
    if (parsed && Array.isArray(parsed.slots)) {
      const slots = normalizeSlots(parsed.slots)
      const active = normalizeActiveSlot(parsed.active ?? 1, slots)
      return { slots, active }
    }

    return { slots: createDefaultSlots(), active: 1 }
  } catch {
    return { slots: createDefaultSlots(), active: 1 }
  }
}

export const useProfileSlots = () => {
  const slots = useState<ProfileSlot[]>('profile-slots', () =>
    createDefaultSlots()
  )
  const activeSlot = useState<number>('profile-active-slot', () => 1)
  const initialized = useState<boolean>(
    'profile-slots-initialized',
    () => false
  )

  const initProfile = () => {
    if (initialized.value) return
    const storedState = loadProfileStateFromStorage()
    slots.value = storedState.slots
    activeSlot.value = storedState.active
    initialized.value = true

    const persistState = () => {
      const state: StoredProfileState = {
        slots: slots.value,
        active: activeSlot.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }

    watch([slots, activeSlot], persistState, { deep: true })
  }

  const getDefaultProfileLabel = (): string => {
    return DEFAULT_PROFILE_LABEL
  }

  const getProfileSlotLabel = (slot: number): string => {
    return `${PROFILE_LABEL_PREFIX}${slot}`
  }

  const getSlotLabel = (slot: number): string => {
    const label = slots.value[slot - 1]?.label
    if (!label || isDefaultLabel(slot, label)) {
      return slot === 1 ? getDefaultProfileLabel() : getProfileSlotLabel(slot)
    }
    return label
  }

  const canAddProfile = computed(() => {
    return slots.value.some((slot, index) => index > 0 && !slot.exists)
  })

  const addProfile = (slot?: number): boolean => {
    const targetIndex =
      slot && slot >= 2 && slot <= MAX_PROFILES
        ? slot - 1
        : slots.value.findIndex((item, index) => index > 0 && !item.exists)

    if (targetIndex < 1 || targetIndex >= MAX_PROFILES) {
      return false
    }

    const slotData = slots.value[targetIndex]!
    slots.value[targetIndex] = {
      ...slotData,
      exists: true,
      label: slotData.label || DEFAULT_SLOTS[targetIndex]!.label,
      lastSyncAt: slotData.lastSyncAt ?? null,
    }
    slots.value = [...slots.value]
    return true
  }

  const deleteProfile = (slot: number): boolean => {
    if (slot <= 1 || slot > MAX_PROFILES) return false
    const target = slots.value[slot - 1]
    if (!target?.exists) return false

    slots.value[slot - 1] = {
      label: DEFAULT_SLOTS[slot - 1]!.label,
      exists: false,
      lastSyncAt: null,
    }

    if (activeSlot.value === slot) {
      const firstExisting = slots.value.findIndex((s) => s.exists)
      activeSlot.value = firstExisting >= 0 ? firstExisting + 1 : 1
    }

    slots.value = [...slots.value]
    return true
  }

  const renameProfile = (slot: number, label: string): boolean => {
    if (slot < 1 || slot > MAX_PROFILES) return false
    const target = slots.value[slot - 1]
    if (!target?.exists) return false

    const trimmed = label.trim()
    if (trimmed.length === 0) return false

    slots.value[slot - 1] = { ...target, label: trimmed }
    slots.value = [...slots.value]
    return true
  }

  const setLastSync = (slot: number, timestamp: string | null): boolean => {
    if (slot < 1 || slot > MAX_PROFILES) return false
    const target = slots.value[slot - 1]
    if (!target?.exists) return false

    slots.value[slot - 1] = {
      ...target,
      lastSyncAt: timestamp,
    }
    slots.value = [...slots.value]
    return true
  }

  const switchProfile = (slot: number): boolean => {
    if (slot < 1 || slot > MAX_PROFILES) return false
    if (!slots.value[slot - 1]?.exists) return false
    activeSlot.value = slot
    return true
  }

  return {
    slots,
    activeSlot,
    initProfile,
    getSlotLabel,
    canAddProfile,
    addProfile,
    deleteProfile,
    renameProfile,
    setLastSync,
    switchProfile,
  }
}
