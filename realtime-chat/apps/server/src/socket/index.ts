import http from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  toggleReactionSchema,
  ERROR_CODES,
} from '@realtime-chat/shared';
import { verifyAccessToken } from '../utils/crypto.js';
import { messageService } from '../services/message.service.js';
import { conversationService } from '../services/conversation.service.js';
import { presenceService } from '../services/presence.service.js';
import { prisma } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export type TypedSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let ioInstance: TypedSocketServer | null = null;

const userMessageTimestamps = new Map<string, number[]>();
const SOCKET_MSG_WINDOW_MS = 5000;
const SOCKET_MSG_MAX_DEFAULT = 10;

export function checkSocketRateLimit(userId: string, maxLimit = SOCKET_MSG_MAX_DEFAULT): boolean {
  const now = Date.now();
  const existing = (userMessageTimestamps.get(userId) || []).filter(
    (ts) => now - ts < SOCKET_MSG_WINDOW_MS,
  );
  if (existing.length >= maxLimit) {
    return false;
  }
  existing.push(now);
  userMessageTimestamps.set(userId, existing);
  return true;
}

export function resetSocketRateLimit(userId?: string) {
  if (userId) userMessageTimestamps.delete(userId);
  else userMessageTimestamps.clear();
}

export function getIO(): TypedSocketServer {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
}

export function initSocketServer(
  httpServer: http.Server,
  options?: { pubClient?: any; subClient?: any },
): TypedSocketServer {
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  const io: TypedSocketServer = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    maxHttpBufferSize: 1e6, // 1 MB payload limit
  });

  // Setup Redis adapter if configured or injected
  if (options?.pubClient && options?.subClient) {
    io.adapter(createAdapter(options.pubClient, options.subClient));
    logger.info('Socket.IO configured with custom Redis adapter');
  } else if (env.NODE_ENV === 'production' && env.REDIS_URL) {
    try {
      const pubClient = new (Redis as any)(env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      pubClient.on('error', (err: any) => {
        logger.warn({ err: err.message }, 'Redis pubClient failed, using in-memory adapter');
      });
      const subClient = pubClient.duplicate();
      subClient.on('error', (err: any) => {
        logger.warn({ err: err.message }, 'Redis subClient failed, using in-memory adapter');
      });
      pubClient
        .connect()
        .then(() => subClient.connect())
        .then(() => {
          io.adapter(createAdapter(pubClient, subClient));
          logger.info('Socket.IO configured with Redis adapter');
        })
        .catch((err: any) => {
          logger.warn({ err: err.message }, 'Could not connect to Redis, using in-memory adapter');
        });
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize Redis adapter, falling back to in-memory');
    }
  }

  // Handshake Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.split(' ')[1]
          : null);

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = await verifyAccessToken(token);
      socket.data = {
        userId: payload.userId,
        username: payload.username,
      };

      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: TypedSocket) => {
    const { userId, username } = socket.data;
    logger.info({ userId, username, socketId: socket.id }, 'Socket connected');

    // 1. Join personal user room
    await socket.join(`user:${userId}`);

    // 2. Join all conversation rooms the user is a member of
    try {
      const memberships = await prisma.membership.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      for (const m of memberships) {
        await socket.join(`conv:${m.conversationId}`);
      }

      // Track online presence & notify mutual rooms if first socket
      const { isFirstSocket, roomIds } = await presenceService.userConnected(userId, socket.id);
      if (isFirstSocket) {
        for (const room of roomIds) {
          socket.to(room).emit('presence:updated', { userId, status: 'online' });
        }
      }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to join conversation rooms on connect');
    }

    // --- Real-Time Event Handlers ---

    // Send Message
    socket.on('message:send', async (payload, callback) => {
      try {
        if (!checkSocketRateLimit(userId, env.NODE_ENV === 'test' ? 100 : 10)) {
          if (typeof callback === 'function') {
            callback({
              ok: false,
              error: {
                code: ERROR_CODES.RATE_LIMITED,
                message: 'You are sending messages too quickly. Please slow down.',
              },
            });
          }
          return;
        }

        const validated = sendMessageSchema.parse(payload);
        const message = await messageService.create(userId, validated);

        // Broadcast to conversation room (including sender so all devices sync)
        io.to(`conv:${validated.conversationId}`).emit('message:created', message);

        if (typeof callback === 'function') {
          callback({ ok: true, data: message });
        }
      } catch (err: any) {
        logger.warn({ err, userId, payload }, 'message:send error');
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to send message',
              details: err.details,
            },
          });
        }
      }
    });

    // Edit Message
    socket.on('message:edit', async (payload, callback) => {
      try {
        const validated = editMessageSchema.parse(payload);
        const updated = await messageService.edit(validated.messageId, userId, validated.body);

        io.to(`conv:${updated.conversationId}`).emit('message:updated', updated);

        if (typeof callback === 'function') {
          callback({ ok: true, data: updated });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to edit message',
            },
          });
        }
      }
    });

    // Delete Message
    socket.on('message:delete', async (payload, callback) => {
      try {
        const validated = deleteMessageSchema.parse(payload);
        const deleted = await messageService.delete(validated.messageId, userId);

        io.to(`conv:${deleted.conversationId}`).emit('message:deleted', deleted);

        if (typeof callback === 'function') {
          callback({ ok: true, data: { messageId: deleted.messageId } });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to delete message',
            },
          });
        }
      }
    });

    // Toggle Emoji Reaction
    socket.on('reaction:toggle', async (payload, callback) => {
      try {
        const validated = toggleReactionSchema.parse(payload);
        const res = await messageService.toggleReaction(validated.messageId, userId, validated.emoji);

        // Fetch conversationId for the message to broadcast
        const msg = await prisma.message.findUnique({
          where: { id: validated.messageId },
          select: { conversationId: true },
        });

        if (msg) {
          io.to(`conv:${msg.conversationId}`).emit('reaction:updated', {
            conversationId: msg.conversationId,
            messageId: res.messageId,
            emoji: res.emoji,
            userId,
            added: res.added,
          });
        }

        if (typeof callback === 'function') {
          callback({ ok: true, data: res });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to toggle reaction',
            },
          });
        }
      }
    });

    // Mark conversation as read
    socket.on('conversation:read', async (payload, callback) => {
      try {
        const result = await conversationService.markAsRead(
          payload.conversationId,
          userId,
          payload.messageId,
        );

        io.to(`conv:${payload.conversationId}`).emit('conversation:read_updated', {
          conversationId: payload.conversationId,
          userId,
          lastReadMessageId: payload.messageId,
        });

        if (typeof callback === 'function') {
          callback({ ok: true, data: result });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to update read state',
            },
          });
        }
      }
    });

    // Join conversation
    socket.on('conversation:join', async (payload, callback) => {
      try {
        const isMember = await conversationService.isMember(payload.conversationId, userId);
        if (!isMember) {
          await conversationService.join(payload.conversationId, userId);
        }

        await socket.join(`conv:${payload.conversationId}`);

        if (typeof callback === 'function') {
          callback({ ok: true, data: { conversationId: payload.conversationId } });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.FORBIDDEN,
              message: err.message || 'Failed to join conversation',
            },
          });
        }
      }
    });

    // Leave conversation
    socket.on('conversation:leave', async (payload, callback) => {
      try {
        await socket.leave(`conv:${payload.conversationId}`);
        if (typeof callback === 'function') {
          callback({ ok: true, data: { conversationId: payload.conversationId } });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to leave conversation',
            },
          });
        }
      }
    });

    // Thread Reply
    socket.on('thread:reply', async (payload, callback) => {
      try {
        const root = await prisma.message.findUnique({
          where: { id: payload.rootMessageId },
          select: { conversationId: true },
        });
        if (!root) throw AppError.notFound('Root thread message not found');

        const message = await messageService.create(userId, {
          conversationId: root.conversationId,
          clientMessageId: payload.clientMessageId,
          body: payload.body,
          replyToId: payload.rootMessageId,
          attachmentIds: payload.attachmentIds,
          metadata: payload.metadata,
        });

        io.to(`conv:${root.conversationId}`).emit('message:created', message);
        io.to(`conv:${root.conversationId}`).emit('thread:updated', {
          conversationId: root.conversationId,
          rootMessageId: payload.rootMessageId,
          replyCount: message.replyCount || 1,
          lastReplyAt: message.createdAt,
          reply: message,
        });

        if (typeof callback === 'function') {
          callback({ ok: true, data: message });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to send thread reply',
            },
          });
        }
      }
    });

    // Toggle Pin on Message
    socket.on('message:pin', async (payload, callback) => {
      try {
        const res = await messageService.togglePin(payload.messageId, userId, payload.pinned);
        io.to(`conv:${res.conversationId}`).emit('message:pinned', res);
        if (typeof callback === 'function') {
          callback({
            ok: true,
            data: { messageId: res.messageId, pinned: res.pinned, pinnedAt: res.pinnedAt },
          });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to toggle pin',
            },
          });
        }
      }
    });

    // Poll Vote
    socket.on('message:poll_vote', async (payload, callback) => {
      try {
        const msg = await prisma.message.findUnique({
          where: { id: payload.messageId },
          select: { conversationId: true },
        });
        if (!msg) throw AppError.notFound('Message not found');

        const poll = await messageService.votePoll(payload.messageId, userId, payload.optionIndex);
        io.to(`conv:${msg.conversationId}`).emit('message:poll_updated', {
          conversationId: msg.conversationId,
          messageId: payload.messageId,
          poll,
        });
        if (typeof callback === 'function') {
          callback({ ok: true, data: { messageId: payload.messageId, poll } });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to vote in poll',
            },
          });
        }
      }
    });

    // Save / Bookmark Message
    socket.on('message:save', async (payload, callback) => {
      try {
        const res = await messageService.toggleSave(payload.messageId, userId, payload.saved);
        if (typeof callback === 'function') {
          callback({ ok: true, data: res });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.BAD_REQUEST,
              message: err.message || 'Failed to save message',
            },
          });
        }
      }
    });

    // Message Effects (Confetti, etc.)
    socket.on('message:effect', async (payload, callback) => {
      try {
        io.to(`conv:${payload.conversationId}`).emit('message:effect', {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          effect: payload.effect,
        });
        if (typeof callback === 'function') {
          callback({ ok: true, data: undefined });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: ERROR_CODES.BAD_REQUEST,
              message: 'Failed to broadcast effect',
            },
          });
        }
      }
    });

    // Reconnect Sync
    socket.on('sync', async (payload, callback) => {
      try {
        const missed = await messageService.getMissedMessages(userId, payload.lastMessageIds || {});
        if (typeof callback === 'function') {
          callback({
            ok: true,
            data: {
              messages: missed,
              readStates: {},
            },
          });
        }
      } catch (err: any) {
        if (typeof callback === 'function') {
          callback({
            ok: false,
            error: {
              code: err.code || ERROR_CODES.INTERNAL_ERROR,
              message: err.message || 'Failed to sync missed messages',
            },
          });
        }
      }
    });

    // Typing Start
    socket.on('typing:start', async (payload, callback) => {
      try {
        socket.to(`conv:${payload.conversationId}`).emit('typing:user', {
          conversationId: payload.conversationId,
          userId,
          username,
          isTyping: true,
        });
        if (typeof callback === 'function') {
          callback({ ok: true, data: undefined });
        }
      } catch {
        if (typeof callback === 'function') {
          callback({ ok: false, error: { code: 'BAD_REQUEST', message: 'Failed to start typing' } });
        }
      }
    });

    // Typing Stop
    socket.on('typing:stop', async (payload, callback) => {
      try {
        socket.to(`conv:${payload.conversationId}`).emit('typing:user', {
          conversationId: payload.conversationId,
          userId,
          username,
          isTyping: false,
        });
        if (typeof callback === 'function') {
          callback({ ok: true, data: undefined });
        }
      } catch {
        if (typeof callback === 'function') {
          callback({ ok: false, error: { code: 'BAD_REQUEST', message: 'Failed to stop typing' } });
        }
      }
    });

    // Presence Heartbeat
    socket.on('presence:heartbeat', async (callback) => {
      await presenceService.heartbeat(userId);
      if (typeof callback === 'function') {
        callback({ ok: true, data: undefined });
      }
    });

    socket.on('disconnect', async () => {
      logger.info({ userId, username, socketId: socket.id }, 'Socket disconnected');
      try {
        const { isLastSocket, roomIds } = await presenceService.userDisconnected(userId, socket.id);
        if (isLastSocket) {
          for (const room of roomIds) {
            socket.to(room).emit('presence:updated', {
              userId,
              status: 'offline',
              lastSeenAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        logger.error({ err, userId }, 'Failed to handle socket disconnect presence');
      }
    });
  });

  ioInstance = io;
  return io;
}
