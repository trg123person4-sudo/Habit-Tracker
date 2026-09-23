import Redis from 'ioredis';
import { PresenceStatus } from '@realtime-chat/shared';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class PresenceService {
  private redis: any = null;
  // In-memory fallback for test and standalone environments
  private inMemoryPresence = new Map<string, { socketIds: Set<string>; lastSeen: number }>();

  constructor() {
    if (env.NODE_ENV === 'production' && env.REDIS_URL) {
      try {
        const client = new (Redis as any)(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
        client.on('error', (err: any) => {
          logger.warn({ err: err.message }, 'PresenceService: Redis error, using in-memory store');
          this.redis = null;
        });
        client
          .connect()
          .then(() => {
            this.redis = client;
            logger.info('PresenceService connected to Redis');
          })
          .catch((err: any) => {
            logger.warn({ err: err.message }, 'PresenceService could not connect to Redis, using in-memory store');
            this.redis = null;
          });
      } catch (err) {
        logger.warn({ err }, 'PresenceService: Redis unavailable, using in-memory store');
        this.redis = null;
      }
    }
  }

  async userConnected(
    userId: string,
    socketId: string,
  ): Promise<{ isFirstSocket: boolean; roomIds: string[] }> {
    let isFirstSocket = false;

    if (this.redis) {
      try {
        const setKey = `user:sockets:${userId}`;
        const count = await this.redis.scard(setKey);
        await this.redis.sadd(setKey, socketId);
        await this.redis.set(`presence:${userId}`, 'online', 'EX', 60);
        isFirstSocket = count === 0;
      } catch {
        this.redis = null;
      }
    }

    if (!this.redis) {
      let entry = this.inMemoryPresence.get(userId);
      if (!entry) {
        entry = { socketIds: new Set(), lastSeen: Date.now() };
        this.inMemoryPresence.set(userId, entry);
        isFirstSocket = true;
      }
      entry.socketIds.add(socketId);
      entry.lastSeen = Date.now();
    }

    // Find mutual conversation rooms to notify (never broadcast globally!)
    const memberships = await prisma.membership.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const roomIds = memberships.map((m) => `conv:${m.conversationId}`);

    return { isFirstSocket, roomIds };
  }

  async userDisconnected(
    userId: string,
    socketId: string,
  ): Promise<{ isLastSocket: boolean; roomIds: string[] }> {
    let isLastSocket = false;

    if (this.redis) {
      try {
        const setKey = `user:sockets:${userId}`;
        await this.redis.srem(setKey, socketId);
        const remaining = await this.redis.scard(setKey);

        if (remaining === 0) {
          await this.redis.del(`presence:${userId}`);
          isLastSocket = true;
        }
      } catch {
        this.redis = null;
      }
    }

    if (!this.redis) {
      const entry = this.inMemoryPresence.get(userId);
      if (entry) {
        entry.socketIds.delete(socketId);
        if (entry.socketIds.size === 0) {
          this.inMemoryPresence.delete(userId);
          isLastSocket = true;
        }
      } else {
        isLastSocket = true;
      }
    }

    const memberships = await prisma.membership.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const roomIds = memberships.map((m) => `conv:${m.conversationId}`);

    return { isLastSocket, roomIds };
  }

  async heartbeat(userId: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.expire(`presence:${userId}`, 60);
        return;
      } catch {
        this.redis = null;
      }
    }
    const entry = this.inMemoryPresence.get(userId);
    if (entry) {
      entry.lastSeen = Date.now();
    }
  }

  async getPresence(userId: string): Promise<PresenceStatus> {
    if (this.redis) {
      try {
        const status = await this.redis.get(`presence:${userId}`);
        return status ? 'online' : 'offline';
      } catch {
        this.redis = null;
      }
    }
    const entry = this.inMemoryPresence.get(userId);
    return entry && entry.socketIds.size > 0 ? 'online' : 'offline';
  }
}

export const presenceService = new PresenceService();
