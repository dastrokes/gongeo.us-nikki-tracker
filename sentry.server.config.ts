import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://80cb15ee9f3c92eaa8cdcee97a75425e@o4509482068869120.ingest.us.sentry.io/4509482070376448',
  tracesSampleRate: 0.1,
  maxBreadcrumbs: 10,

  debug: false,
  enabled: process.env.NODE_ENV === 'production',
})
