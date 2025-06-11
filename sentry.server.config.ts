import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: 'https://80cb15ee9f3c92eaa8cdcee97a75425e@o4509482068869120.ingest.us.sentry.io/4509482070376448',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
})
