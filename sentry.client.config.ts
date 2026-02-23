import * as Sentry from '@sentry/nuxt'

const sentryDsn = process.env.SENTRY_DSN

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.1,
  maxBreadcrumbs: 20,

  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  beforeSend(event) {
    const ignorePatterns = [
      /resizeobserver/i,
      /networkerror/i,
      /fetcherror/i,
      /failed to fetch/i,
      /script error/i,
      /script failed/i,
      /couldn't resolve component/i,
      /error loading dynamically imported module/i,
      /load failed/i,
      /sitemap not prerendered/i,
      /operation was aborted/i,
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
  enabled: process.env.NODE_ENV === 'production' && Boolean(sentryDsn),
})
