import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error(`Unhandled Exception: ${err.message}`, { stack: err.stack, path: req.path });

  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' ? { details: err.stack } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
