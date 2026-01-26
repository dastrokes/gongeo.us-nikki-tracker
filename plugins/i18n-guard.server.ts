export default defineNuxtPlugin({
  name: 'i18n-guard',
  dependsOn: ['i18n:plugin'],
  async setup() {
    if (!import.meta.server) return

    const i18n = useNuxtApp().$i18n as {
      loadLocaleMessages?: (locale: string) => Promise<void>
      getLocaleMessage?: (locale: string) => Record<string, string>
      locale?: { value?: string }
    }
    const code = i18n.locale?.value
    if (!code) return

    const existing = i18n.getLocaleMessage?.(code)
    if (existing && Object.keys(existing).length > 0) return

    await i18n.loadLocaleMessages?.(code)
  },
})
