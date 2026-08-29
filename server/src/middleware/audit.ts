import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth';
import { memoryDb, isUsingPostgres, getDbPool } from '../db/connection';
import { logger } from '../config/logger';

export function auditLogger(req: AuthRequest, res: Response, next: NextFunction): void {
  // Only intercept mutating methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Execute asynchronously without blocking response
      setImmediate(async () => {
        try {
          if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
            const pathParts = req.baseUrl.split('/').filter(Boolean);
            const entity = pathParts[pathParts.length - 1] || 'general';
            const action = `${req.method}_${entity.toUpperCase()}`;
            const entityId = req.params.id || body?.data?.id || null;

            const logEntry = {
              id: uuidv4(),
              org_id: req.user.org_id,
              user_id: req.user.id,
              action,
              entity,
              entity_id: entityId,
              old_values: null,
              new_values: req.body ? { ...req.body } : null,
              ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
              user_agent: req.headers['user-agent'] || 'Unknown',
              created_at: new Date().toISOString(),
            };

            // Redact sensitive password fields if any
            if (logEntry.new_values?.password) {
              logEntry.new_values.password = '***REDACTED***';
            }

            if (isUsingPostgres()) {
              const pool = getDbPool();
              if (pool) {
                await pool.query(
                  `INSERT INTO audit_logs (id, org_id, user_id, action, entity, entity_id, new_values, ip_address, user_agent)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                  [
                    logEntry.id,
                    logEntry.org_id,
                    logEntry.user_id,
                    logEntry.action,
                    logEntry.entity,
                    logEntry.entity_id,
                    JSON.stringify(logEntry.new_values),
                    logEntry.ip_address,
                    logEntry.user_agent,
                  ]
                );
              }
            } else {
              memoryDb.audit_logs.unshift(logEntry);
            }
          }
        } catch (err: any) {
          logger.error(`Audit logging failed: ${err.message}`);
        }
      });

      return originalJson(body);
    };
  }

  next();
}
