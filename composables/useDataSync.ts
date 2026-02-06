import type {
  PullRecord,
  EditRecord,
  EvoRecord,
  PearpalTrackerItem,
} from '~/types/pull'
import { MAX_PROFILES } from '~/composables/useProfileSlots'
import { gzipSync, gunzipSync, strFromU8 } from 'fflate'

interface SyncData {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  evo: Record<number, EvoRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
  profile?: {
    label: string
  }
}

export const useDataSync = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()
  const { saveData, loadData, savePearpalData } = useIndexedDB()
  const { activeSlot, addProfile, renameProfile, slots, setLastSync } =
    useProfileSlots()
  const { initFromData } = usePullStoreData()

  const BUCKET_NAME = 'gongeo.us'
  const SLOT_FILE_PATTERN = /^pull-data(?:-(\d+))?\.json\.gz$/

  // Generate file path for user's data
  const getUserDataPath = (userId: string, slot = activeSlot.value): string => {
    if (slot === 1) {
      return `${userId}/pull-data.json.gz`
    }
    return `${userId}/pull-data-${slot}.json.gz`
  }

  const buildProfileMeta = (slot: number): SyncData['profile'] => {
    const slotData = slots.value[slot - 1]
    if (!slotData?.exists) return undefined
    const label = slotData.label?.trim()
    if (!label) return undefined
    return { label }
  }

  const applyProfileMeta = (profile: SyncData['profile'], slot: number) => {
    if (!profile?.label) return
    if (slot < 1 || slot > MAX_PROFILES) return

    const trimmed = profile.label.trim()
    if (!trimmed) return

    const slotData = slots.value[slot - 1]
    if (!slotData?.exists) {
      addProfile(slot)
    }

    renameProfile(slot, trimmed)
  }

  // Compress data using gzip
  const compressData = (data: SyncData): Uint8Array => {
    const jsonString = JSON.stringify(data)
    return gzipSync(new TextEncoder().encode(jsonString))
  }

  // Decompress gzip data
  const decompressData = (compressedData: Uint8Array): SyncData => {
    const jsonString = strFromU8(gunzipSync(compressedData))
    return JSON.parse(jsonString)
  }

  // Upload data to Supabase Storage
  const uploadData = async (
    slotOverride?: number
  ): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      // Get current data from IndexedDB
      const rawData = await loadData(slotOverride ?? activeSlot.value)
      const slot = slotOverride ?? activeSlot.value
      const syncData: SyncData = {
        pulls: rawData.pulls,
        edits: rawData.edits,
        evo: rawData.evo,
        pearpal: rawData.pearpal,
        profile: buildProfileMeta(slot),
      }

      // Check if there's any data to upload
      if (
        Object.keys(syncData.pulls).length === 0 &&
        Object.keys(syncData.edits).length === 0 &&
        Object.keys(syncData.evo).length === 0 &&
        Object.keys(syncData.pearpal).length === 0
      ) {
        return { success: false }
      }

      // Compress the data
      const compressedData = compressData(syncData)

      // Upload to Supabase Storage
      const filePath = getUserDataPath(user.value.id, slot)

      await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedData, {
          contentType: 'application/gzip',
          upsert: true, // Overwrite existing file
          cacheControl: '0',
        })

      setLastSync(slot, new Date().toISOString())
      return { success: true }
    } catch {
      return { success: false }
    }
  }

  // Download data from Supabase Storage
  const downloadData = async (
    slotOverride?: number
  ): Promise<{
    success: boolean
    data?: SyncData
  }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      const filePath = getUserDataPath(
        user.value.id,
        slotOverride ?? activeSlot.value
      )

      // Download from Supabase Storage
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .download(filePath)

      if (!data) {
        return { success: false }
      }

      // Convert blob to array buffer and then to Uint8Array
      const arrayBuffer = await data.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Decompress the data
      const syncData = decompressData(uint8Array)

      return { success: true, data: syncData }
    } catch {
      return { success: false }
    }
  }

  const getRemoteSlotsWithData = async (): Promise<number[]> => {
    if (!user.value?.id) {
      return []
    }

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(user.value.id, { limit: 10 })

      if (error || !data) {
        return []
      }

      const slots = new Set<number>()
      for (const item of data) {
        const match = SLOT_FILE_PATTERN.exec(item.name)
        if (!match) continue
        const slot = match[1] ? Number(match[1]) : 1
        if (!Number.isFinite(slot)) continue
        if (slot < 1 || slot > MAX_PROFILES) continue
        slots.add(slot)
      }

      return Array.from(slots).sort((a, b) => a - b)
    } catch {
      return []
    }
  }

  const listUserSlotFiles = async (
    userId: string
  ): Promise<Set<string> | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId, { limit: 10 })

      if (error || !data) {
        return null
      }

      const filePaths = new Set<string>()
      for (const item of data) {
        if (!SLOT_FILE_PATTERN.test(item.name)) continue
        filePaths.add(`${userId}/${item.name}`)
      }

      return filePaths
    } catch {
      return null
    }
  }

  // Sync data (download from remote and merge with local)
  const syncData = async (
    slotOverride?: number
  ): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      // Download remote data
      const { success, data: remoteData } = await downloadData(
        slotOverride ?? activeSlot.value
      )

      if (!success || !remoteData) {
        return { success: false }
      }

      const resolvedSlot = slotOverride ?? activeSlot.value
      applyProfileMeta(remoteData.profile, resolvedSlot)

      // Merge local and remote data
      const localData = await loadData(resolvedSlot)

      const mergedPulls = { ...localData.pulls, ...remoteData.pulls }
      const mergedEdits = { ...localData.edits, ...remoteData.edits }
      const mergedEvo = { ...localData.evo, ...remoteData.evo }
      const mergedPearpal = { ...localData.pearpal, ...remoteData.pearpal }

      await saveData(mergedPulls, mergedEdits, mergedEvo, resolvedSlot)
      await savePearpalData(mergedPearpal, resolvedSlot)

      await initFromData({
        pulls: mergedPulls,
        edits: mergedEdits,
        evo: mergedEvo,
        pearpal: mergedPearpal,
      })

      setLastSync(resolvedSlot, new Date().toISOString())
      return { success: true }
    } catch (error) {
      console.error('Sync error:', error)
      return { success: false }
    }
  }

  // Clear cloud data (delete from Supabase Storage)
  const clearCloudData = async (
    slotOverride?: number
  ): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      const slot = slotOverride ?? activeSlot.value
      const filePath = getUserDataPath(user.value.id, slot)
      const remoteFiles = await listUserSlotFiles(user.value.id)
      if (!remoteFiles) {
        return { success: false }
      }

      // Treat missing remote files as already cleared.
      if (!remoteFiles.has(filePath)) {
        return { success: true }
      }

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])
      if (error) {
        return { success: false }
      }

      return { success: true }
    } catch {
      return { success: false }
    }
  }

  return {
    uploadData,
    getRemoteSlotsWithData,
    syncData,
    clearCloudData,
  }
}
