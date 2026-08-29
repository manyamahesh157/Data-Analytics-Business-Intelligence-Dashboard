import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

let redisClient: Redis | null = null;
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

export function initRedis(): void {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      connectTimeout: 1000,
      retryStrategy: () => null, // don't loop retry if offline
    });

    redisClient.on('error', (err) => {
      // Gracefully swallow offline error when running with in-memory cache
      redisClient = null;
    });

    redisClient.connect().then(() => {
      logger.info('Connected to Redis Cache.');
    }).catch((err) => {
      logger.warn(`Redis not reachable (${err.message}). Using high-speed in-memory TTL cache.`);
      redisClient = null;
    });
  } catch (err: any) {
    logger.warn(`Redis initialization error. Using in-memory TTL cache.`);
    redisClient = null;
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  if (redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      // Fallback
    }
  }

  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value as T;
}

export async function setCache(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch {
      // Fallback
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch {
      // Ignore
    }
  }

  // Clear memory cache keys that match
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const k of memoryCache.keys()) {
    if (regex.test(k)) {
      memoryCache.delete(k);
    }
  }
}
