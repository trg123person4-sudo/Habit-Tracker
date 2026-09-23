import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import http from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../app.js';
import { initSocketServer } from './index.js';
import { signAccessToken } from '../utils/crypto.js';
import { prisma } from '../db/client.js';

describe('Real-Time Socket Core (Dual Client Integration)', () => {
  let server: http.Server;
  let serverPort: number;
  let tokenAlice: string;
  let tokenBob: string;
  let tokenCharlie: string;

  let clientAlice: ClientSocket;
  let clientBob: ClientSocket;
  let clientCharlie: ClientSocket;

  // In-memory data store for the test
  let messages: any[] = [];
  let memberships: any[] = [];
  let conversations: any[] = [];
  let reactions: any[] = [];

  const convGeneral = 'conv_general_123';
  const convPrivate = 'conv_secret_456';

  beforeAll(async () => {
    // Generate valid JWT tokens for test users
    tokenAlice = await signAccessToken({ userId: 'user_alice', username: 'alice' });
    tokenBob = await signAccessToken({ userId: 'user_bob', username: 'bob' });
    tokenCharlie = await signAccessToken({ userId: 'user_charlie', username: 'charlie' });

    const app = createApp();
    server = http.createServer(app);
    initSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        serverPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    clientAlice?.disconnect();
    clientBob?.disconnect();
    clientCharlie?.disconnect();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(async () => {
    messages = [];
    reactions = [];
    conversations = [
      { id: convGeneral, type: 'CHANNEL', isPrivate: false, name: 'general' },
      { id: convPrivate, type: 'CHANNEL', isPrivate: true, name: 'secret-ops' },
    ];
    // Alice and Bob are in general; only Alice is in secret-ops
    memberships = [
      { id: 'm1', conversationId: convGeneral, userId: 'user_alice', role: 'OWNER' },
      { id: 'm2', conversationId: convGeneral, userId: 'user_bob', role: 'MEMBER' },
      { id: 'm3', conversationId: convPrivate, userId: 'user_alice', role: 'OWNER' },
    ];

    // Mock prisma operations for tests
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

    vi.spyOn(prisma.conversation, 'findUnique').mockImplementation(async ({ where }: any) => {
      return conversations.find((c) => c.id === where.id) ?? null;
    });

    vi.spyOn(prisma.conversation, 'update').mockImplementation(async () => ({} as any));

    vi.spyOn(prisma.message, 'findUnique').mockImplementation(async ({ where }: any) => {
      if (where.senderId_clientMessageId) {
        const { senderId, clientMessageId } = where.senderId_clientMessageId;
        return messages.find((m) => m.senderId === senderId && m.clientMessageId === clientMessageId) ?? null;
      }
      if (where.id) {
        return messages.find((m) => m.id === where.id) ?? null;
      }
      return null;
    });

    vi.spyOn(prisma.message, 'create').mockImplementation(async ({ data }: any) => {
      const msg = {
        ...data,
        createdAt: new Date(),
        editedAt: null,
        deletedAt: null,
        deletedBy: null,
        sender: {
          id: data.senderId,
          username: data.senderId.replace('user_', ''),
          displayName: data.senderId.replace('user_', ''),
          avatarUrl: null,
          statusMessage: null,
        },
        replyTo: null,
        attachments: [],
        reactions: [],
      };
      messages.push(msg);
      return msg;
    });

    vi.spyOn(prisma.message, 'update').mockImplementation(async ({ where, data }: any) => {
      const msg = messages.find((m) => m.id === where.id);
      if (msg) {
        Object.assign(msg, data);
        return msg;
      }
      throw new Error('Message not found');
    });

    vi.spyOn(prisma.message, 'findMany').mockImplementation(async ({ where }: any) => {
      let filtered = messages.filter((m) => m.conversationId === where.conversationId);
      if (where.id?.gt) {
        filtered = filtered.filter((m) => m.id > where.id.gt);
      }
      return filtered;
    });

    vi.spyOn(prisma.reaction, 'findUnique').mockImplementation(async ({ where }: any) => {
      if (where.messageId_userId_emoji) {
        const { messageId, userId, emoji } = where.messageId_userId_emoji;
        return (
          reactions.find(
            (r) => r.messageId === messageId && r.userId === userId && r.emoji === emoji,
          ) ?? null
        );
      }
      return null;
    });

    vi.spyOn(prisma.reaction, 'create').mockImplementation(async ({ data }: any) => {
      const reaction = { id: 'r_' + uuidv4(), ...data };
      reactions.push(reaction);
      return reaction;
    });

    vi.spyOn(prisma.reaction, 'delete').mockImplementation(async ({ where }: any) => {
      const idx = reactions.findIndex((r) => r.id === where.id);
      if (idx !== -1) {
        return reactions.splice(idx, 1)[0];
      }
      return {} as any;
    });

    vi.spyOn(prisma.membership, 'update').mockImplementation(async ({ where, data }: any) => {
      const m = memberships.find((item) => item.id === where.id);
      if (m) {
        Object.assign(m, data);
        return m;
      }
      return {} as any;
    });

    vi.spyOn(prisma.message, 'count').mockImplementation(async () => 0);

    // Connect socket clients
    if (clientAlice) clientAlice.disconnect();
    if (clientBob) clientBob.disconnect();
    if (clientCharlie) clientCharlie.disconnect();

    clientAlice = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: tokenAlice },
      transports: ['websocket'],
    });

    clientBob = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: tokenBob },
      transports: ['websocket'],
    });

    clientCharlie = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: tokenCharlie },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((res) => clientAlice.on('connect', () => res())),
      new Promise<void>((res) => clientBob.on('connect', () => res())),
      new Promise<void>((res) => clientCharlie.on('connect', () => res())),
    ]);
  });

  it('Client A sends a message and Client B receives it in real time', async () => {
    const clientMessageId = uuidv4();
    const testBody = 'Hello from Alice to Bob via WebSocket! 🚀';

    const bobReceivedPromise = new Promise<any>((resolve) => {
      clientBob.on('message:created', (msg) => {
        resolve(msg);
      });
    });

    const ackPromise = new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        {
          conversationId: convGeneral,
          clientMessageId,
          body: testBody,
        },
        (res: any) => resolve(res),
      );
    });

    const [ackResult, receivedMsg] = await Promise.all([ackPromise, bobReceivedPromise]);

    expect(ackResult.ok).toBe(true);
    expect(ackResult.data.body).toBe(testBody);
    expect(ackResult.data.clientMessageId).toBe(clientMessageId);

    expect(receivedMsg.body).toBe(testBody);
    expect(receivedMsg.senderId).toBe('user_alice');
    expect(receivedMsg.conversationId).toBe(convGeneral);
    expect(receivedMsg.id).toBe(ackResult.data.id);
  });

  it('Idempotency: duplicate clientMessageId creates exactly one message', async () => {
    const clientMessageId = uuidv4();
    const body = 'Idempotent message payload';

    // First send
    const ack1 = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId, body },
        (res: any) => resolve(res),
      );
    });

    expect(ack1.ok).toBe(true);
    const firstId = ack1.data.id;
    expect(messages).toHaveLength(1);

    // Duplicate retry with same clientMessageId
    const ack2 = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId, body },
        (res: any) => resolve(res),
      );
    });

    expect(ack2.ok).toBe(true);
    expect(ack2.data.id).toBe(firstId);
    expect(messages).toHaveLength(1); // Still exactly one in DB!
  });

  it('Authorization: non-member cannot send to a private conversation', async () => {
    const ack = await new Promise<any>((resolve) => {
      clientCharlie.emit(
        'message:send',
        {
          conversationId: convPrivate,
          clientMessageId: uuidv4(),
          body: 'Trying to intrude into secret ops',
        },
        (res: any) => resolve(res),
      );
    });

    expect(ack.ok).toBe(false);
    expect(ack.error.code).toBe('FORBIDDEN');
  });

  it('Reconnect sync: returns missed messages after reconnecting', async () => {
    // 1. Alice sends message 1 while both are connected
    const ack1 = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'Message 1' },
        (res: any) => resolve(res),
      );
    });
    const lastKnownId = ack1.data.id;

    // 2. Bob disconnects (simulating subway tunnel / network loss)
    clientBob.disconnect();

    // 3. Alice sends message 2 and message 3 while Bob is offline
    await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'Message 2 while offline' },
        (res: any) => resolve(res),
      );
    });

    await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'Message 3 while offline' },
        (res: any) => resolve(res),
      );
    });

    // 4. Bob reconnects
    clientBob = ioClient(`http://localhost:${serverPort}`, {
      auth: { token: tokenBob },
      transports: ['websocket'],
    });

    await new Promise<void>((res) => clientBob.on('connect', () => res()));

    // 5. Bob requests sync with last known ID
    const syncAck = await new Promise<any>((resolve) => {
      clientBob.emit(
        'sync',
        { lastMessageIds: { [convGeneral]: lastKnownId } },
        (res: any) => resolve(res),
      );
    });

    expect(syncAck.ok).toBe(true);
    const missed = syncAck.data.messages[convGeneral];
    expect(missed).toBeDefined();
    expect(missed).toHaveLength(2);
    expect(missed[0].body).toBe('Message 2 while offline');
    expect(missed[1].body).toBe('Message 3 while offline');
  });

  it('Edit and soft-delete: broadcast to conversation members', async () => {
    // Send initial message
    const sendAck = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'Original text' },
        (res: any) => resolve(res),
      );
    });
    const messageId = sendAck.data.id;

    // Bob listens for edit
    const bobEditPromise = new Promise<any>((resolve) => {
      clientBob.on('message:updated', (msg) => resolve(msg));
    });

    // Alice edits
    const editAck = await new Promise<any>((resolve) => {
      clientAlice.emit('message:edit', { messageId, body: 'Edited text' }, (res: any) =>
        resolve(res),
      );
    });
    expect(editAck.ok).toBe(true);

    const editedMsg = await bobEditPromise;
    expect(editedMsg.body).toBe('Edited text');
    expect(editedMsg.id).toBe(messageId);

    // Bob listens for delete
    const bobDeletePromise = new Promise<any>((resolve) => {
      clientBob.on('message:deleted', (payload) => resolve(payload));
    });

    // Alice deletes
    const deleteAck = await new Promise<any>((resolve) => {
      clientAlice.emit('message:delete', { messageId }, (res: any) => resolve(res));
    });
    expect(deleteAck.ok).toBe(true);

    const deletedPayload = await bobDeletePromise;
    expect(deletedPayload.messageId).toBe(messageId);
    expect(deletedPayload.deletedBy).toBe('user_alice');
  });

  it('Typing indicators: broadcasts typing:start and typing:stop within conversation room', async () => {
    // Bob listens for typing:user
    const bobTypingStartPromise = new Promise<any>((resolve) => {
      clientBob.on('typing:user', (data) => {
        if (data.isTyping) resolve(data);
      });
    });

    // Alice starts typing
    const startAck = await new Promise<any>((resolve) => {
      clientAlice.emit('typing:start', { conversationId: convGeneral }, (res: any) =>
        resolve(res),
      );
    });
    expect(startAck.ok).toBe(true);

    const typingStartData = await bobTypingStartPromise;
    expect(typingStartData.conversationId).toBe(convGeneral);
    expect(typingStartData.userId).toBe('user_alice');
    expect(typingStartData.isTyping).toBe(true);

    // Bob listens for typing:stop
    const bobTypingStopPromise = new Promise<any>((resolve) => {
      clientBob.on('typing:user', (data) => {
        if (!data.isTyping) resolve(data);
      });
    });

    // Alice stops typing
    const stopAck = await new Promise<any>((resolve) => {
      clientAlice.emit('typing:stop', { conversationId: convGeneral }, (res: any) => resolve(res));
    });
    expect(stopAck.ok).toBe(true);

    const typingStopData = await bobTypingStopPromise;
    expect(typingStopData.conversationId).toBe(convGeneral);
    expect(typingStopData.userId).toBe('user_alice');
    expect(typingStopData.isTyping).toBe(false);
  });

  it('Reactions: toggle reaction broadcasts to conversation members', async () => {
    // Alice sends a message
    const sendAck = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'React to this!' },
        (res: any) => resolve(res),
      );
    });
    const messageId = sendAck.data.id;

    // Alice listens for reaction:updated
    const aliceReactionPromise = new Promise<any>((resolve) => {
      clientAlice.on('reaction:updated', (data) => resolve(data));
    });

    // Bob toggles reaction
    const reactAck = await new Promise<any>((resolve) => {
      clientBob.emit('reaction:toggle', { messageId, emoji: '🔥' }, (res: any) => resolve(res));
    });
    expect(reactAck.ok).toBe(true);
    expect(reactAck.data.added).toBe(true);

    const reactionData = await aliceReactionPromise;
    expect(reactionData.messageId).toBe(messageId);
    expect(reactionData.emoji).toBe('🔥');
    expect(reactionData.userId).toBe('user_bob');
    expect(reactionData.added).toBe(true);
  });

  it('Read receipts: marks conversation as read and broadcasts pointer update', async () => {
    const sendAck = await new Promise<any>((resolve) => {
      clientAlice.emit(
        'message:send',
        { conversationId: convGeneral, clientMessageId: uuidv4(), body: 'Read receipt test' },
        (res: any) => resolve(res),
      );
    });
    const messageId = sendAck.data.id;

    // Alice listens for read pointer update
    const readUpdatedPromise = new Promise<any>((resolve) => {
      clientAlice.on('conversation:read_updated', (data) => resolve(data));
    });

    // Bob marks as read
    const readAck = await new Promise<any>((resolve) => {
      clientBob.emit(
        'conversation:read',
        { conversationId: convGeneral, messageId },
        (res: any) => resolve(res),
      );
    });
    expect(readAck.ok).toBe(true);

    const readData = await readUpdatedPromise;
    expect(readData.conversationId).toBe(convGeneral);
    expect(readData.userId).toBe('user_bob');
    expect(readData.lastReadMessageId).toBe(messageId);
  });

  it('Presence: heartbeat acknowledged by server', async () => {
    const heartbeatAck = await new Promise<any>((resolve) => {
      clientAlice.emit('presence:heartbeat', (res: any) => resolve(res));
    });
    expect(heartbeatAck.ok).toBe(true);
  });
});
