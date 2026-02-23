import * as Sentry from '@sentry/nuxt'

const sentryDsn = process.env.SENTRY_DSN

Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: 0.1,
  maxBreadcrumbs: 10,

  debug: false,
  enabled: process.env.NODE_ENV === 'production' && Boolean(sentryDsn),
})
