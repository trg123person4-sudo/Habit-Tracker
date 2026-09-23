import {
  CreateConversationInput,
  UpdateConversationInput,
  ConversationDto,
  MembershipDto,
  UserSummaryDto,
} from '@realtime-chat/shared';
import { prisma } from '../db/client.js';
import { generateId } from '../utils/ulid.js';
import { AppError } from '../errors/app-error.js';

export class ConversationService {
  private formatUserSummary(user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    statusMessage: string | null;
  }): UserSummaryDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      statusMessage: user.statusMessage,
    };
  }

  private formatMembershipDto(m: any): MembershipDto {
    return {
      id: m.id,
      conversationId: m.conversationId,
      userId: m.userId,
      role: m.role as any,
      lastReadMessageId: m.lastReadMessageId,
      mutedUntil: m.mutedUntil ? m.mutedUntil.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      user: m.user ? this.formatUserSummary(m.user) : undefined,
    };
  }

  async listForUser(userId: string): Promise<ConversationDto[]> {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            memberships: {
              include: { user: true },
            },
            messages: {
              orderBy: { id: 'desc' },
              take: 1,
              include: {
                sender: true,
                reactions: true,
                attachments: true,
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const results: ConversationDto[] = [];

    for (const m of memberships) {
      const conv = m.conversation;
      const lastMsg = conv.messages[0];

      // Calculate unread count (messages newer than lastReadMessageId and not sent by user)
      let unreadCount = 0;
      if (m.lastReadMessageId) {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            id: { gt: m.lastReadMessageId },
            senderId: { not: userId },
            deletedAt: null,
          },
        });
      } else {
        unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            deletedAt: null,
          },
        });
      }

      // If DM, pick the other user's display name if conversation name is null
      let convName = conv.name;
      if (conv.type === 'DM' && !convName) {
        const otherMember = conv.memberships.find((mem) => mem.userId !== userId);
        convName = otherMember?.user.displayName || otherMember?.user.username || 'Direct Message';
      }

      results.push({
        id: conv.id,
        type: conv.type as any,
        name: convName,
        topic: conv.topic,
        isPrivate: conv.isPrivate,
        archivedAt: conv.archivedAt ? conv.archivedAt.toISOString() : null,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        members: conv.memberships.map((mem) => this.formatMembershipDto(mem)),
        unreadCount,
        isMuted: m.mutedUntil ? new Date(m.mutedUntil) > new Date() : false,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderId: lastMsg.senderId,
              sender: this.formatUserSummary(lastMsg.sender),
              body: lastMsg.deletedAt ? 'This message was deleted' : lastMsg.body,
              replyToId: lastMsg.replyToId,
              clientMessageId: lastMsg.clientMessageId,
              editedAt: lastMsg.editedAt ? lastMsg.editedAt.toISOString() : null,
              deletedAt: lastMsg.deletedAt ? lastMsg.deletedAt.toISOString() : null,
              deletedBy: lastMsg.deletedBy,
              createdAt: lastMsg.createdAt.toISOString(),
              attachments: [],
              reactions: [],
            }
          : null,
      });
    }

    return results;
  }

  async create(userId: string, input: CreateConversationInput): Promise<ConversationDto> {
    const convId = generateId();

    // Direct Message (1:1): check if one already exists between these 2 users
    if (input.type === 'DM') {
      const recipientId = input.memberUserIds[0];
      if (!recipientId || recipientId === userId) {
        throw AppError.badRequest('DM requires a distinct recipient user ID');
      }

      // Find existing 1:1 DM
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DM',
          AND: [
            { memberships: { some: { userId } } },
            { memberships: { some: { userId: recipientId } } },
          ],
        },
        include: {
          memberships: { include: { user: true } },
        },
      });

      if (existing) {
        const otherMember = existing.memberships.find((m) => m.userId !== userId);
        return {
          id: existing.id,
          type: 'DM',
          name: otherMember?.user.displayName || otherMember?.user.username || 'Direct Message',
          topic: existing.topic,
          isPrivate: true,
          archivedAt: existing.archivedAt ? existing.archivedAt.toISOString() : null,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
          members: existing.memberships.map((m) => this.formatMembershipDto(m)),
          unreadCount: 0,
        };
      }

      const conv = await prisma.conversation.create({
        data: {
          id: convId,
          type: 'DM',
          isPrivate: true,
          memberships: {
            create: [
              { userId, role: 'MEMBER' },
              { userId: recipientId, role: 'MEMBER' },
            ],
          },
        },
        include: {
          memberships: { include: { user: true } },
        },
      });

      const otherMember = conv.memberships.find((m) => m.userId !== userId);
      return {
        id: conv.id,
        type: 'DM',
        name: otherMember?.user.displayName || otherMember?.user.username || 'Direct Message',
        topic: null,
        isPrivate: true,
        archivedAt: null,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        members: conv.memberships.map((m) => this.formatMembershipDto(m)),
        unreadCount: 0,
      };
    }

    // Channel or Group
    const membersToCreate = [{ userId, role: 'OWNER' }];
    for (const memberId of input.memberUserIds) {
      if (memberId !== userId) {
        membersToCreate.push({ userId: memberId, role: 'MEMBER' });
      }
    }

    const conv = await prisma.conversation.create({
      data: {
        id: convId,
        type: input.type,
        name: input.name || null,
        topic: input.topic || null,
        isPrivate: input.type === 'GROUP' ? true : input.isPrivate,
        memberships: {
          create: membersToCreate,
        },
      },
      include: {
        memberships: { include: { user: true } },
      },
    });

    return {
      id: conv.id,
      type: conv.type as any,
      name: conv.name,
      topic: conv.topic,
      isPrivate: conv.isPrivate,
      archivedAt: null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      members: conv.memberships.map((m) => this.formatMembershipDto(m)),
      unreadCount: 0,
    };
  }

  async update(
    conversationId: string,
    userId: string,
    input: UpdateConversationInput,
  ): Promise<ConversationDto> {
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      throw AppError.forbidden('Must be channel admin or owner to update channel');
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.topic !== undefined) data.topic = input.topic;
    if (input.archived !== undefined) data.archivedAt = input.archived ? new Date() : null;

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data,
      include: {
        memberships: { include: { user: true } },
      },
    });

    return {
      id: updated.id,
      type: updated.type as any,
      name: updated.name,
      topic: updated.topic,
      isPrivate: updated.isPrivate,
      archivedAt: updated.archivedAt ? updated.archivedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      members: updated.memberships.map((m) => this.formatMembershipDto(m)),
    };
  }

  async getById(conversationId: string, userId: string): Promise<ConversationDto> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        memberships: { include: { user: true } },
      },
    });

    if (!conv) {
      throw AppError.notFound('Conversation not found');
    }

    const isMember = conv.memberships.some((m) => m.userId === userId);
    if (!isMember && conv.isPrivate) {
      throw AppError.forbidden('You do not have permission to view this conversation');
    }

    let convName = conv.name;
    if (conv.type === 'DM' && !convName) {
      const otherMember = conv.memberships.find((mem) => mem.userId !== userId);
      convName = otherMember?.user.displayName || otherMember?.user.username || 'Direct Message';
    }

    return {
      id: conv.id,
      type: conv.type as any,
      name: convName,
      topic: conv.topic,
      isPrivate: conv.isPrivate,
      archivedAt: conv.archivedAt ? conv.archivedAt.toISOString() : null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      members: conv.memberships.map((m) => this.formatMembershipDto(m)),
    };
  }

  async listPublicChannels(): Promise<ConversationDto[]> {
    const channels = await prisma.conversation.findMany({
      where: {
        type: 'CHANNEL',
        isPrivate: false,
        archivedAt: null,
      },
      include: {
        memberships: { include: { user: true } },
      },
      orderBy: { name: 'asc' },
    });

    return channels.map((c) => ({
      id: c.id,
      type: 'CHANNEL',
      name: c.name,
      topic: c.topic,
      isPrivate: false,
      archivedAt: null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      members: c.memberships.map((m) => this.formatMembershipDto(m)),
    }));
  }

  async join(conversationId: string, userId: string): Promise<MembershipDto> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw AppError.notFound('Conversation not found');
    }

    if (conv.isPrivate) {
      throw AppError.forbidden('Cannot join a private conversation without an invitation');
    }

    const existing = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });

    if (existing) {
      return this.formatMembershipDto(existing);
    }

    const membership = await prisma.membership.create({
      data: {
        conversationId,
        userId,
        role: 'MEMBER',
      },
      include: { user: true },
    });

    return this.formatMembershipDto(membership);
  }

  async leave(conversationId: string, userId: string): Promise<void> {
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });

    if (!membership) {
      throw AppError.notFound('Membership not found');
    }

    if (membership.role === 'OWNER') {
      const otherMembers = await prisma.membership.findMany({
        where: { conversationId, userId: { not: userId } },
      });
      if (otherMembers.length > 0) {
        throw AppError.badRequest('Transfer channel ownership before leaving');
      }
    }

    await prisma.membership.delete({
      where: { id: membership.id },
    });
  }

  async markAsRead(
    conversationId: string,
    userId: string,
    messageId: string,
  ): Promise<{ conversationId: string; lastReadMessageId: string; unreadCount: number }> {
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });

    if (!membership) {
      throw AppError.forbidden('Not a member of this conversation');
    }

    await prisma.membership.update({
      where: { id: membership.id },
      data: { lastReadMessageId: messageId },
    });

    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        id: { gt: messageId },
        senderId: { not: userId },
        deletedAt: null,
      },
    });

    return {
      conversationId,
      lastReadMessageId: messageId,
      unreadCount,
    };
  }

  async isMember(conversationId: string, userId: string): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    return !!membership;
  }

  async kickMember(
    conversationId: string,
    operatorUserId: string,
    targetUserId: string,
  ): Promise<{ success: boolean; conversationId: string; userId: string }> {
    if (operatorUserId === targetUserId) {
      throw AppError.badRequest('Cannot kick yourself; use leave instead');
    }

    const operatorMembership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId: operatorUserId, conversationId } },
    });

    if (
      !operatorMembership ||
      (operatorMembership.role !== 'OWNER' && operatorMembership.role !== 'ADMIN')
    ) {
      throw AppError.forbidden('Only channel owners or admins can kick members');
    }

    const targetMembership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId: targetUserId, conversationId } },
    });

    if (!targetMembership) {
      throw AppError.notFound('Target user is not a member of this conversation');
    }

    if (targetMembership.role === 'OWNER') {
      throw AppError.forbidden('Cannot kick the channel owner');
    }

    if (targetMembership.role === 'ADMIN' && operatorMembership.role !== 'OWNER') {
      throw AppError.forbidden('Only the channel owner can kick an admin');
    }

    await prisma.membership.delete({
      where: { id: targetMembership.id },
    });

    return { success: true, conversationId, userId: targetUserId };
  }

  async muteMember(
    conversationId: string,
    operatorUserId: string,
    targetUserId: string,
    durationMinutes: number = 60,
  ): Promise<{ conversationId: string; userId: string; mutedUntil: string }> {
    const operatorMembership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId: operatorUserId, conversationId } },
    });

    if (
      !operatorMembership ||
      (operatorMembership.role !== 'OWNER' && operatorMembership.role !== 'ADMIN')
    ) {
      throw AppError.forbidden('Only channel owners or admins can mute members');
    }

    const targetMembership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId: targetUserId, conversationId } },
    });

    if (!targetMembership) {
      throw AppError.notFound('Target user is not a member of this conversation');
    }

    if (targetMembership.role === 'OWNER') {
      throw AppError.forbidden('Cannot mute the channel owner');
    }

    const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    await prisma.membership.update({
      where: { id: targetMembership.id },
      data: { mutedUntil },
    });

    return {
      conversationId,
      userId: targetUserId,
      mutedUntil: mutedUntil.toISOString(),
    };
  }
}

export const conversationService = new ConversationService();
