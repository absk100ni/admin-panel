import * as Sentry from '@sentry/react';
import pkg from '../../package.json';

let eventCount = 0;
const MAX_EVENTS_PER_SESSION = 10;

export function initSentry() {
  if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    release: `ecom-admin-panel@${pkg.version}`,
    sampleRate: 1.0,
    tracesSampleRate: 0,

    ignoreErrors: [
      'Network Error',
      'Failed to fetch',
      'Load failed',
      'AbortError',
      /timeout of \d+ms exceeded/,
      'Request aborted',
      'ResizeObserver loop',
      'ChunkLoadError',
      /Loading chunk [\d]+ failed/,
      /dynamically imported module/,
    ],

    denyUrls: [
      /chrome-extension:\/\//,
      /moz-extension:\/\//,
      /safari-extension:\/\//,
    ],

    beforeSend(event) {
      // Drop events with no useful stacktrace (cross-origin "Script error.")
      const exception = event.exception?.values?.[0];
      if (
        exception?.value === 'Script error.' &&
        (!exception.stacktrace || !exception.stacktrace.frames?.length)
      ) {
        return null;
      }

      // Client-side rate cap: max 10 events per session
      eventCount++;
      if (eventCount > MAX_EVENTS_PER_SESSION) {
        return null;
      }

      return event;
    },
  });
}

export { Sentry };
