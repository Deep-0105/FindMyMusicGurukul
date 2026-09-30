const logger = require('../utils/logger');

// Middleware 1: Log every incoming API request call with method, path, status, duration, & error reasons
const apiLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;
  let responseBody = null;

  // Override res.json to capture response message payload for logging
  const originalJson = res.json;
  res.json = function (body) {
    responseBody = body;
    return originalJson.apply(this, arguments);
  };

  // Override res.send as fallback
  const originalSend = res.send;
  res.send = function (body) {
    if (!responseBody && body) {
      try {
        responseBody = typeof body === 'string' ? JSON.parse(body) : body;
      } catch (e) {
        responseBody = body;
      }
    }
    return originalSend.apply(this, arguments);
  };

  logger.info(`➡️  [API CALL STARTED] ${method} ${originalUrl} (Client IP: ${ip || req.socket.remoteAddress})`);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      const errorReason =
        responseBody?.message ||
        responseBody?.error ||
        (typeof responseBody === 'string' ? responseBody : null) ||
        'Error occurred during request processing';

      logger.warn(
        `⚠️  [API CALL FAILED] ${method} ${originalUrl} - Status: ${statusCode} (${duration}ms) - Reason: "${errorReason}"`
      );
    } else {
      logger.info(`✅ [API CALL SUCCESS] ${method} ${originalUrl} - Status: ${statusCode} (${duration}ms)`);
    }
  });

  next();
};

// Middleware 2: Global Error Handler Middleware
const apiErrorHandler = (err, req, res, next) => {
  const method = req ? req.method : 'UNKNOWN';
  const url = req ? req.originalUrl : 'UNKNOWN';
  const statusCode = err.status || err.statusCode || 500;

  logger.error(`❌ [API ERROR OCCURRED] [${method} ${url}] - Reason: "${err.message}"`, {
    statusCode,
    stack: err.stack
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    api: `${method} ${url}`,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  apiLogger,
  apiErrorHandler
};
