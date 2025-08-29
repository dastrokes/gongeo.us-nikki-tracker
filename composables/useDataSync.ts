import type {
  PullRecord,
  EditRecord,
  EvoRecord,
  PearpalTrackerItem,
} from '~/types/pull'
import { gzipSync, gunzipSync, strFromU8 } from 'fflate'

interface SyncData {
  pulls: Record<number, PullRecord[]>
  edits: Record<number, EditRecord[]>
  evo: Record<number, EvoRecord[]>
  pearpal: Record<number, PearpalTrackerItem[]>
}

export const useDataSync = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()
  const pullStore = usePullStore()
  const { saveData, loadData } = useIndexedDB()

  const BUCKET_NAME = 'gongeo.us'

  // Generate file path for user's data
  const getUserDataPath = (userId: string): string => {
    return `${userId}/pull-data.json.gz`
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
  const uploadData = async (): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      // Get current data from IndexedDB
      const rawData = await loadData()
      const syncData: SyncData = {
        pulls: rawData.pulls,
        edits: rawData.edits,
        evo: rawData.evo,
        pearpal: rawData.pearpal,
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
      const filePath = getUserDataPath(user.value.id)

      await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedData, {
          contentType: 'application/gzip',
          upsert: true, // Overwrite existing file
          cacheControl: '0',
        })

      return { success: true }
    } catch {
      return { success: false }
    }
  }

  // Download data from Supabase Storage
  const downloadData = async (): Promise<{
    success: boolean
    data?: SyncData
  }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      const filePath = getUserDataPath(user.value.id)

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

  // Sync data (download from remote and merge with local)
  const syncData = async (): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      // Download remote data
      const { success, data: remoteData } = await downloadData()

      if (!success || !remoteData) {
        return { success: false }
      }

      // Merge local and remote data
      const localData = await loadData()

      const mergedPulls = { ...localData.pulls, ...remoteData.pulls }
      const mergedEdits = { ...localData.edits, ...remoteData.edits }
      const mergedEvo = { ...localData.evo, ...remoteData.evo }
      const mergedPearpal = { ...localData.pearpal, ...remoteData.pearpal }

      await saveData(mergedPulls, mergedEdits, mergedEvo)
      const { savePearpalData } = useIndexedDB()
      await savePearpalData(mergedPearpal)

      // Process pearpal tracker data first if available
      if (Object.keys(mergedPearpal).length > 0) {
        await pullStore.processPearpalData(mergedPearpal)
      } else if (
        Object.keys(mergedPulls).length > 0 ||
        Object.keys(mergedEdits).length > 0
      ) {
        // Process pull and edit data if no pearpal data
        await pullStore.processPullData(mergedPulls, mergedEdits)
      }

      // Process evolution data
      if (Object.keys(mergedEvo).length > 0) {
        pullStore.evoData = mergedEvo
      }

      return { success: true }
    } catch {
      return { success: false }
    }
  }

  // Clear cloud data (delete from Supabase Storage)
  const clearCloudData = async (): Promise<{ success: boolean }> => {
    if (!user.value?.id) {
      return { success: false }
    }

    try {
      const filePath = getUserDataPath(user.value.id)

      // Delete from Supabase Storage
      await supabase.storage.from(BUCKET_NAME).remove([filePath])

      return { success: true }
    } catch {
      return { success: false }
    }
  }

  return {
    uploadData,
    syncData,
    clearCloudData,
  }
}
