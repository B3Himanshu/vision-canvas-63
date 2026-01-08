/**
 * Monitoring and logging utilities
 * For production, integrate with services like Sentry, LogRocket, etc.
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

/**
 * Log levels
 */
export const LogLevel: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Log message with level
 */
export function log(level: keyof LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console[level === 'ERROR' ? 'error' : level.toLowerCase() as any](logEntry);
  }

  // In production, send to logging service
  // TODO: Integrate with Sentry, LogRocket, or similar
  if (process.env.NODE_ENV === 'production') {
    // Example: send to external logging service
    // logService.send(logEntry);
  }
}

/**
 * Log error with stack trace
 */
export function logError(error: Error, context?: Record<string, any>) {
  log('ERROR', error.message, {
    stack: error.stack,
    ...context,
  });
}

/**
 * Track analytics event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // In production, send to analytics service
  // TODO: Integrate with Google Analytics, Mixpanel, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', eventName, properties);
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(metricName: string, value: number, unit: string = 'ms') {
  // In production, send to performance monitoring service
  // TODO: Integrate with New Relic, Datadog, etc.
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance:', metricName, value, unit);
  }
}
