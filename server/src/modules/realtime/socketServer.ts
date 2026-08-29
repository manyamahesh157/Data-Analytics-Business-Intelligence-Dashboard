import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AuthenticatedUser } from '../../types';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUser;
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      next(new Error('Invalid token: ' + err.message));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthenticatedUser;
    logger.info(`WebSocket Client Connected: ${user.email} (Org: ${user.org_id}) [Socket: ${socket.id}]`);

    // Automatically join organization broadcast room
    socket.join(`org:${user.org_id}`);

    // Join specific dashboard rooms on request
    socket.on('subscribe:dashboard', (dashboardId: string) => {
      socket.join(`dashboard:${dashboardId}`);
      logger.debug(`Socket ${socket.id} subscribed to dashboard:${dashboardId}`);
    });

    socket.on('unsubscribe:dashboard', (dashboardId: string) => {
      socket.leave(`dashboard:${dashboardId}`);
      logger.debug(`Socket ${socket.id} left dashboard:${dashboardId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket Client Disconnected: ${user.email} [Socket: ${socket.id}]`);
    });
  });

  logger.info('WebSocket Server initialized.');
  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitKpiUpdate(orgId: string, kpi: any): void {
  if (io) {
    io.to(`org:${orgId}`).emit('kpi:updated', { kpi, timestamp: new Date().toISOString() });
  }
}

export function emitAlert(orgId: string, alert: any): void {
  if (io) {
    io.to(`org:${orgId}`).emit('alert:triggered', { alert, timestamp: new Date().toISOString() });
  }
}

export function emitImportProgress(orgId: string, jobData: { jobId: string; status: string; progress: number; processedRows: number; totalRows: number }): void {
  if (io) {
    io.to(`org:${orgId}`).emit('import:progress', { ...jobData, timestamp: new Date().toISOString() });
  }
}

export function emitWidgetRefresh(orgId: string, dashboardId: string, widgetId?: string): void {
  if (io) {
    io.to(`dashboard:${dashboardId}`).emit('widget:refresh', { dashboardId, widgetId, timestamp: new Date().toISOString() });
    io.to(`org:${orgId}`).emit('dashboard:refresh', { dashboardId, timestamp: new Date().toISOString() });
  }
}
