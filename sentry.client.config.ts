import { init } from '@sentry/nuxt'

init({
  dsn: 'https://80cb15ee9f3c92eaa8cdcee97a75425e@o4509482068869120.ingest.us.sentry.io/4509482070376448',
  tracesSampleRate: 0.01,
  maxBreadcrumbs: 20,

  beforeSend(event) {
    if (
      event.exception?.values?.some((ex) => {
        const val = ex.value?.toLowerCase() || ''
        return (
          val.includes('resizeobserver') ||
          val.includes('networkerror') ||
          val.includes('fetcherror') ||
          val.includes('failed to fetch') ||
          val.includes('script error') ||
          val.includes('script failed')
        )
      })
    ) {
      return null
    }
    return event
  },

  debug: false,
  enabled: process.env.NODE_ENV === 'production',
})
