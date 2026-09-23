import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { monotonicFactory } from 'ulidx';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const ulid = monotonicFactory();

async function hashPw(pw: string) {
  return argon2.hash(pw, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing data in reverse order of foreign keys
  await prisma.reaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 2. Create Users
  const defaultPasswordHash = await hashPw('Password123!');

  const alice = await prisma.user.create({
    data: {
      id: ulid(),
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Alice Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      statusMessage: 'Focusing on real-time messaging architecture 🚀',
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: ulid(),
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Bob Jones',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      statusMessage: 'Reviewing pull requests ☕',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      id: ulid(),
      username: 'charlie',
      email: 'charlie@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Charlie Brown',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      statusMessage: 'Testing Redis pub/sub latency',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      id: ulid(),
      username: 'moderator',
      email: 'moderator@example.com',
      passwordHash: defaultPasswordHash,
      displayName: 'System Moderator',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      statusMessage: 'Keeping the channels organized 🛡️',
    },
  });

  console.log('👤 Created demo users: alice, bob, charlie, moderator (password: Password123!)');

  // 3. Create Channels
  const generalChannel = await prisma.conversation.create({
    data: {
      id: ulid(),
      type: 'CHANNEL',
      name: 'general',
      topic: 'Company-wide announcements and general discussion',
      isPrivate: false,
    },
  });

  const randomChannel = await prisma.conversation.create({
    data: {
      id: ulid(),
      type: 'CHANNEL',
      name: 'random',
      topic: 'Water cooler banter, memes, and pet pictures 🐶',
      isPrivate: false,
    },
  });

  const engineeringChannel = await prisma.conversation.create({
    data: {
      id: ulid(),
      type: 'CHANNEL',
      name: 'engineering',
      topic: 'Architecture specs, CI/CD, and PR discussions',
      isPrivate: true,
    },
  });

  // 4. Create Memberships
  await prisma.membership.createMany({
    data: [
      { conversationId: generalChannel.id, userId: alice.id, role: 'OWNER' },
      { conversationId: generalChannel.id, userId: moderator.id, role: 'ADMIN' },
      { conversationId: generalChannel.id, userId: bob.id, role: 'MEMBER' },
      { conversationId: generalChannel.id, userId: charlie.id, role: 'MEMBER' },

      { conversationId: randomChannel.id, userId: alice.id, role: 'OWNER' },
      { conversationId: randomChannel.id, userId: bob.id, role: 'MEMBER' },
      { conversationId: randomChannel.id, userId: charlie.id, role: 'MEMBER' },

      { conversationId: engineeringChannel.id, userId: alice.id, role: 'OWNER' },
      { conversationId: engineeringChannel.id, userId: bob.id, role: 'ADMIN' },
    ],
  });

  console.log('📢 Created channels: #general, #random, #engineering (private)');

  // 5. Create Direct Message
  const dmAliceBob = await prisma.conversation.create({
    data: {
      id: ulid(),
      type: 'DM',
      isPrivate: true,
    },
  });

  await prisma.membership.createMany({
    data: [
      { conversationId: dmAliceBob.id, userId: alice.id, role: 'MEMBER' },
      { conversationId: dmAliceBob.id, userId: bob.id, role: 'MEMBER' },
    ],
  });

  console.log('💬 Created 1:1 DM conversation between Alice and Bob');

  // 6. Create Messages and Reactions in #general
  const msg1 = await prisma.message.create({
    data: {
      id: ulid(),
      conversationId: generalChannel.id,
      senderId: alice.id,
      body: 'Welcome everyone to **PulseChat**! 🎉\n\nBuilt from scratch with strict TypeScript, WebSockets, and Redis pub/sub.',
      clientMessageId: uuidv4(),
    },
  });

  await prisma.reaction.createMany({
    data: [
      { messageId: msg1.id, userId: bob.id, emoji: '👋' },
      { messageId: msg1.id, userId: charlie.id, emoji: '🚀' },
      { messageId: msg1.id, userId: moderator.id, emoji: '🎉' },
    ],
  });

  const msg2 = await prisma.message.create({
    data: {
      id: ulid(),
      conversationId: generalChannel.id,
      senderId: bob.id,
      body: 'Excited to test the real-time latency and monotonic ULID message ordering! ⚡',
      clientMessageId: uuidv4(),
      replyToId: msg1.id,
    },
  });

  await prisma.reaction.create({
    data: {
      messageId: msg2.id,
      userId: alice.id,
      emoji: '❤️',
    },
  });

  await prisma.message.create({
    data: {
      id: ulid(),
      conversationId: generalChannel.id,
      senderId: charlie.id,
      body: 'Code blocks render with sanitized markdown:\n```typescript\nconst status = "online";\nconsole.log(`User is ${status}`);\n```',
      clientMessageId: uuidv4(),
    },
  });

  // Messages in DM
  await prisma.message.create({
    data: {
      id: ulid(),
      conversationId: dmAliceBob.id,
      senderId: alice.id,
      body: 'Hey Bob, did you check out the new token family rotation for auth?',
      clientMessageId: uuidv4(),
    },
  });

  await prisma.message.create({
    data: {
      id: ulid(),
      conversationId: dmAliceBob.id,
      senderId: bob.id,
      body: 'Yes, replay attack detection revokes the whole family immediately. Very secure! 🛡️',
      clientMessageId: uuidv4(),
    },
  });

  console.log('✉️ Seeded initial messages, replies, and reactions.');
  console.log('✅ Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
