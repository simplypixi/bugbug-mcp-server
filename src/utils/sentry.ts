import * as Sentry from '@sentry/node';
import { getEnvironmentConfig } from './config.js';

/**
 * Initialize Sentry for error tracking and monitoring
 */
export function initializeSentry(): void {
  const config = getEnvironmentConfig();
  const sentryDsn = config.sentryDsn;
  
  if (!sentryDsn) {
    if (config.isProduction) {
      console.warn('⚠️  SENTRY_DSN not provided in production environment. Error tracking disabled.');
    } else {
      console.debug('SENTRY_DSN not provided, Sentry monitoring disabled');
    }
    return;
  }

  // Environment-specific configuration
  const sentryConfig: Sentry.NodeOptions = {
    dsn: sentryDsn,
    environment: config.nodeEnv,
    debug: config.isDevelopment && config.debug,
    sendDefaultPii: true,
    tracesSampleRate: config.isProduction ? 0.1 : 1.0, // 100% in dev, 10% in prod
    beforeSend(event: Sentry.Event) {      
      // In development, also log errors to console
      if (config.isDevelopment && event.exception) {
        console.error('Sentry captured exception:', event.exception);
      }
      
      return event;
    },
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Console(),
    ],
  };

  // Production-specific settings
  if (config.isProduction) {
    sentryConfig.release = process.env.npm_package_version || '1.0.0';
    sentryConfig.beforeBreadcrumb = (breadcrumb) => {
      // Filter out debug breadcrumbs in production
      if (breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    };
  }

  Sentry.init(sentryConfig);

  console.log(`✅ Sentry initialized for ${config.nodeEnv} environment`);
}

/**
 * Capture an exception with Sentry
 */
export function captureException(error: Error, context?: Record<string, string | number | boolean>): void {
  if (context) {
    Sentry.withScope((scope: Sentry.Scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, string | number | boolean>): void {
  if (context) {
    Sentry.withScope((scope: Sentry.Scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Close Sentry and flush any pending events
 */
export async function closeSentry(): Promise<void> {
  await Sentry.close(2000); // 2 second timeout
}
