export class Logger {
  constructor(context = '') {
    this.context = context;
  }

  formatMessage(level, message, data = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...data,
    });
  }

  info(message, data = {}) {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message, data = {}) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message, error = null, data = {}) {
    console.error(this.formatMessage('ERROR', message, {
      ...data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : null,
    }));
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

export function createLogger(context) {
  return new Logger(context);
}

export class RequestLogger {
  constructor(options = {}) {
    this.logger = options.logger || new Logger('API');
    this.logBody = options.logBody ?? false;
    this.logHeaders = options.logHeaders ?? false;
  }

  async middleware(request, context) {
    const startTime = Date.now();
    const { method, url } = request;
    const requestId = crypto.randomUUID();

    const logData = {
      requestId,
      method,
      url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    };

    if (this.logHeaders) {
      logData.headers = Object.fromEntries(request.headers);
    }

    this.logger.info('Request received', logData);

    return {
      requestId,
      startTime,
      logResponse: (response) => {
        const duration = Date.now() - startTime;
        this.logger.info('Request completed', {
          requestId,
          method,
          url,
          status: response.status,
          duration: `${duration}ms`,
        });
      },
    };
  }

  wrap(handler) {
    return async (request, context = {}) => {
      const logContext = await this.middleware(request, context);
      const response = await handler(request, { ...context, ...logContext });
      
      if (logContext.logResponse) {
        logContext.logResponse(response);
      }

      return response;
    };
  }
}

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(key) {
    this.metrics.set(key, { startTime: Date.now() });
  }

  endTimer(key) {
    const metric = this.metrics.get(key);
    if (metric) {
      metric.duration = Date.now() - metric.startTime;
      return metric.duration;
    }
    return null;
  }

  getMetric(key) {
    return this.metrics.get(key);
  }

  clearMetrics() {
    this.metrics.clear();
  }

  middleware(handler) {
    return async (request, context = {}) => {
      const monitor = new PerformanceMonitor();
      monitor.startTimer('total');

      const response = await handler(request, { ...context, monitor });

      const duration = monitor.endTimer('total');
      
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Response-Time', `${duration}ms`);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    };
  }
}

export async function createHealthCheck(checks = {}) {
  const results = {};
  let isHealthy = true;

  for (const [name, checkFn] of Object.entries(checks)) {
    try {
      const result = await checkFn();
      results[name] = {
        status: 'healthy',
        ...result,
      };
    } catch (error) {
      isHealthy = false;
      results[name] = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: results,
  };
}

export function healthCheckEndpoint(checks = {}) {
  return async () => {
    const health = await createHealthCheck(checks);
    const status = health.status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(health), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

export const defaultHealthChecks = {
  memory: () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      };
    }
    return { available: false };
  },

  uptime: () => {
    if (typeof process !== 'undefined' && process.uptime) {
      return {
        uptime: `${Math.round(process.uptime())}s`,
      };
    }
    return { available: false };
  },

  timestamp: () => ({
    serverTime: new Date().toISOString(),
  }),
};

export const createRequestLogger = (options) => new RequestLogger(options);
export const createPerformanceMonitor = () => new PerformanceMonitor();
