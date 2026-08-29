import { Router, Response, NextFunction } from 'express';
import { AuthRequest, authMiddleware } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac';
import { memoryDb, isUsingPostgres, getDbPool } from '../../db/connection';

const router = Router();
router.use(authMiddleware);

router.get('/', requirePermission('org:admin'), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user!.org_id;
    let logs = [];

    if (isUsingPostgres()) {
      const pool = getDbPool();
      if (pool) {
        const result = await pool.query(
          `SELECT a.*, u.email as user_email, u.first_name, u.last_name
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.user_id
           WHERE a.org_id = $1 ORDER BY a.created_at DESC LIMIT 100`,
          [orgId]
        );
        logs = result.rows;
      }
    } else {
      logs = memoryDb.audit_logs
        .filter((l) => l.org_id === orgId)
        .map((l) => {
          const u = memoryDb.users.find((user) => user.id === l.user_id);
          return {
            ...l,
            user_email: u?.email || 'system',
            first_name: u?.first_name || 'System',
            last_name: u?.last_name || 'Admin',
          };
        });
    }

    res.json({
      success: true,
      data: logs,
      meta: { total: logs.length, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
