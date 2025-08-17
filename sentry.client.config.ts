import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://80cb15ee9f3c92eaa8cdcee97a75425e@o4509482068869120.ingest.us.sentry.io/4509482070376448',
  tracesSampleRate: 0.1,
  maxBreadcrumbs: 20,

  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,
  // integrations: [Sentry.replayIntegration()],

  beforeSend(event) {
    const ignorePatterns = [
      /resizeobserver/i,
      /networkerror/i,
      /fetcherror/i,
      /failed to fetch/i,
      /script error/i,
      /script failed/i,
      /couldn't resolve component/i,
    ]

    if (
      event.exception?.values?.some((ex) =>
        ignorePatterns.some((pattern) => pattern.test(ex.value || ''))
      )
    ) {
      return null
    }
    return event
  },

  debug: false,
  enabled: process.env.NODE_ENV === 'production',
})
