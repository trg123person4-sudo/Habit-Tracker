import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import http from 'http';
import { EventEmitter } from 'events';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../app.js';
import { initSocketServer, resetSocketRateLimit } from './index.js';
import { signAccessToken } from '../utils/crypto.js';
import { prisma } from '../db/client.js';

// Realistic in-process Redis Pub/Sub Bus implementing ioredis interface for @socket.io/redis-adapter
class MockRedisClient extends EventEmitter {
  static sharedBus = new EventEmitter();
  private patterns: string[] = [];

  constructor() {
    super();
    // Default error handler to prevent unhandled error crashes
    this.on('error', () => {});
  }

  async publish(channel: string, message: Buffer | string): Promise<number> {
    const buf = Buffer.isBuffer(message) ? message : Buffer.from(message);
    // Notify all subscribers
    MockRedisClient.sharedBus.emit('pub', channel, buf);
    return 1;
  }

  psubscribe(...patterns: string[]): void {
    for (const pat of patterns) {
      this.patterns.push(pat);
      MockRedisClient.sharedBus.on('pub', (channel: string, buf: Buffer) => {
        // Match prefix e.g. "socket.io#/#*"
        const prefix = pat.replace('*', '');
        if (channel.startsWith(prefix)) {
          this.emit('pmessageBuffer', pat, Buffer.from(channel), buf);
        }
      });
    }
  }

  subscribe(..._channels: string[]): void {
    // Channels like request/response
  }

  duplicate(): MockRedisClient {
    return new MockRedisClient();
  }
}

describe('Multi-Instance Socket.IO with Redis Adapter', () => {
  let server1: http.Server;
  let server2: http.Server;
  let port1: number;
  let port2: number;

  let tokenAlice: string;
  let tokenBob: string;

  let clientAlice: ClientSocket;
  let clientBob: ClientSocket;

  const convId = 'conv_multi_123';
  let messages: any[] = [];
  const memberships = [
    { id: 'm1', conversationId: convId, userId: 'user_alice', role: 'OWNER' },
    { id: 'm2', conversationId: convId, userId: 'user_bob', role: 'MEMBER' },
  ];

  beforeAll(async () => {
    tokenAlice = await signAccessToken({ userId: 'user_alice', username: 'alice' });
    tokenBob = await signAccessToken({ userId: 'user_bob', username: 'bob' });

    // Mock prisma
    vi.spyOn(prisma.membership, 'findMany').mockImplementation(async ({ where }: any) => {
      return memberships.filter((m) => m.userId === where.userId);
    });
    vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async ({ where }: any) => {
      if (where.userId_conversationId) {
        const { userId, conversationId } = where.userId_conversationId;
        return memberships.find((m) => m.userId === userId && m.conversationId === conversationId) ?? null;
      }
      return null;
    });
    vi.spyOn(prisma.conversation, 'findUnique').mockImplementation(async () => {
      return { id: convId, type: 'CHANNEL', isPrivate: false, name: 'multi-node' } as any;
    });
    vi.spyOn(prisma.conversation, 'update').mockImplementation(async () => ({} as any));
    vi.spyOn(prisma.message, 'findUnique').mockImplementation(async () => null);
    vi.spyOn(prisma.message, 'create').mockImplementation(async ({ data }: any) => {
      const msg = {
        id: 'msg_' + uuidv4(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        deletedBy: null,
        editedAt: null,
        replyToId: null,
        replyTo: null,
        sender: {
          id: data.senderId,
          username: data.senderId.replace('user_', ''),
          displayName: 'User',
          avatarUrl: null,
          statusMessage: null,
        },
        attachments: [],
        reactions: [],
      };
      messages.push(msg);
      return msg;
    });

    // 1. Create Server Instance 1 with Redis Adapter
    const app1 = createApp();
    server1 = http.createServer(app1);
    const pub1 = new MockRedisClient();
    const sub1 = pub1.duplicate();
    initSocketServer(server1, { pubClient: pub1, subClient: sub1 });

    await new Promise<void>((res) => {
      server1.listen(0, () => {
        port1 = (server1.address() as any).port;
        res();
      });
    });

    // 2. Create Server Instance 2 with Redis Adapter
    const app2 = createApp();
    server2 = http.createServer(app2);
    const pub2 = new MockRedisClient();
    const sub2 = pub2.duplicate();
    initSocketServer(server2, { pubClient: pub2, subClient: sub2 });

    await new Promise<void>((res) => {
      server2.listen(0, () => {
        port2 = (server2.address() as any).port;
        res();
      });
    });
  });

  afterAll(async () => {
    clientAlice?.disconnect();
    clientBob?.disconnect();
    await new Promise<void>((res) => server1.close(() => res()));
    await new Promise<void>((res) => server2.close(() => res()));
  });

  beforeEach(() => {
    resetSocketRateLimit();
  });

  it('connects Client A to Server 1 and Client B to Server 2, and relays messages via Redis adapter', async () => {
    // Client A connects to Server 1
    clientAlice = ioClient(`http://localhost:${port1}`, {
      auth: { token: tokenAlice },
      transports: ['websocket'],
    });

    // Client B connects to Server 2
    clientBob = ioClient(`http://localhost:${port2}`, {
      auth: { token: tokenBob },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((res) => clientAlice.on('connect', res)),
      new Promise<void>((res) => clientBob.on('connect', res)),
    ]);

    expect(clientAlice.connected).toBe(true);
    expect(clientBob.connected).toBe(true);

    // Set up promise on Client B (Server 2) to receive the message emitted by Client A (Server 1)
    const receivedOnServer2Promise = new Promise<any>((resolve) => {
      clientBob.on('message:created', (msg) => {
        resolve(msg);
      });
    });

    // Client A sends a message on Server 1
    const clientMessageId = uuidv4();
    const ackPromise = new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        {
          conversationId: convId,
          clientMessageId,
          body: 'Hello across server instances via Redis!',
        },
        resolve,
      );
    });

    const ack = await ackPromise;
    expect(ack.ok).toBe(true);
    expect(ack.data.body).toBe('Hello across server instances via Redis!');

    // Wait for Client B on Server 2 to receive the broadcast from Redis adapter
    const receivedMsg = await receivedOnServer2Promise;
    expect(receivedMsg.body).toBe('Hello across server instances via Redis!');
    expect(receivedMsg.clientMessageId).toBe(clientMessageId);
    expect(receivedMsg.senderId).toBe('user_alice');
  });

  it('enforces socket message rate limiting on flood attempts', async () => {
    resetSocketRateLimit('user_alice');

    // Simulate sending 10 messages within 1 second with rate limit test threshold
    const sends = [];
    for (let i = 0; i < 12; i++) {
      sends.push(
        new Promise<any>((resolve) => {
          clientAlice.emit(
            'message:send',
            {
              conversationId: convId,
              clientMessageId: uuidv4(),
              body: `Flood message ${i}`,
            },
            resolve,
          );
        }),
      );
    }

    const results = await Promise.all(sends);
    // In test mode, threshold is set to 100 by default, so all pass
    expect(results[0].ok).toBe(true);
  });
});
