import { MessageDto, UserSummaryDto, SendMessageInput } from '@realtime-chat/shared';
import { prisma } from '../db/client.js';
import { generateId } from '../utils/ulid.js';
import { AppError } from '../errors/app-error.js';

export class MessageService {
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

  private formatMessageDto(msg: any): MessageDto {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      sender: this.formatUserSummary(msg.sender),
      body: msg.deletedAt ? 'This message was deleted' : msg.body,
      replyToId: msg.replyToId,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            sender: this.formatUserSummary(msg.replyTo.sender),
            body: msg.replyTo.deletedAt ? 'This message was deleted' : msg.replyTo.body,
          }
        : null,
      clientMessageId: msg.clientMessageId,
      editedAt: msg.editedAt ? msg.editedAt.toISOString() : null,
      deletedAt: msg.deletedAt ? msg.deletedAt.toISOString() : null,
      deletedBy: msg.deletedBy,
      replyCount: msg.replyCount || 0,
      lastReplyAt: msg.lastReplyAt ? msg.lastReplyAt.toISOString() : null,
      pinnedAt: msg.pinnedAt ? msg.pinnedAt.toISOString() : null,
      pinnedById: msg.pinnedById || null,
      metadata: msg.metadata || null,
      isSaved: !!(msg.savedBy && msg.savedBy.length > 0),
      createdAt: msg.createdAt.toISOString(),
      attachments: (msg.attachments || []).map((att: any) => ({
        id: att.id,
        messageId: att.messageId,
        conversationId: att.conversationId,
        uploaderId: att.uploaderId,
        fileName: att.fileName,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        s3Key: att.s3Key,
        thumbnailKey: att.thumbnailKey,
        url: `/api/v1/uploads/${att.id}`,
        createdAt: att.createdAt.toISOString(),
      })),
      reactions: this.aggregateReactions(msg.reactions || []),
      status: 'sent',
    };
  }

  private aggregateReactions(reactions: any[]) {
    const map = new Map<string, string[]>();
    for (const r of reactions) {
      const users = map.get(r.emoji) || [];
      users.push(r.userId);
      map.set(r.emoji, users);
    }

    return Array.from(map.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
      hasReacted: false, // Computed per requesting user if needed
    }));
  }

  async getMessages(
    conversationId: string,
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      direction?: 'older' | 'newer';
    },
  ): Promise<{ messages: MessageDto[]; nextCursor?: string; hasMore: boolean }> {
    // Check membership
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });

    if (!membership) {
      throw AppError.forbidden('Not a member of this conversation');
    }

    const limit = Math.min(options.limit || 50, 100);
    const direction = options.direction || 'older';

    const whereClause: any = { conversationId };

    if (options.cursor) {
      whereClause.id = direction === 'older' ? { lt: options.cursor } : { gt: options.cursor };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { id: direction === 'older' ? 'desc' : 'asc' },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
      },
    });

    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, limit) : messages;

    // Normalize order so client always receives chronological order (oldest to newest)
    if (direction === 'older') {
      results.reverse();
    }

    const nextCursor = hasMore
      ? direction === 'older'
        ? results[0]?.id
        : results[results.length - 1]?.id
      : undefined;

    return {
      messages: results.map((m) => this.formatMessageDto(m)),
      nextCursor,
      hasMore,
    };
  }

  async create(senderId: string, input: SendMessageInput): Promise<MessageDto> {
    // 1. Authorization: check membership
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId: senderId, conversationId: input.conversationId } },
    });

    if (!membership) {
      throw AppError.forbidden('Cannot send messages to a conversation you are not a member of');
    }

    if (membership.mutedUntil && new Date(membership.mutedUntil) > new Date()) {
      throw AppError.forbidden(
        `You are muted in this conversation until ${new Date(membership.mutedUntil).toLocaleTimeString()}`,
      );
    }

    // 2. Idempotency Check: check if (senderId, clientMessageId) already exists!
    const existing = await prisma.message.findUnique({
      where: {
        senderId_clientMessageId: {
          senderId,
          clientMessageId: input.clientMessageId,
        },
      },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
      },
    });

    if (existing) {
      return this.formatMessageDto(existing);
    }

    // 3. Monotonic sortable ULID
    const messageId = generateId();

    const created = await prisma.message.create({
      data: {
        id: messageId,
        conversationId: input.conversationId,
        senderId,
        body: input.body,
        replyToId: input.replyToId || null,
        clientMessageId: input.clientMessageId,
        metadata: (input as any).metadata || null,
      },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
      },
    });

    // If replyToId provided, update parent thread counter
    if (input.replyToId) {
      await prisma.message
        .update({
          where: { id: input.replyToId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
          },
        })
        .catch(() => {});
    }

    // 4. Link uploaded attachments if provided
    if (input.attachmentIds && input.attachmentIds.length > 0) {
      await prisma.attachment.updateMany({
        where: {
          id: { in: input.attachmentIds },
          uploaderId: senderId,
        },
        data: {
          messageId,
          conversationId: input.conversationId,
        },
      });

      const linked = await prisma.attachment.findMany({
        where: { messageId },
      });
      created.attachments = linked;
    }

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });

    return this.formatMessageDto(created);
  }

  async edit(messageId: string, userId: string, body: string): Promise<MessageDto> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      throw AppError.notFound('Message not found');
    }

    if (msg.senderId !== userId) {
      throw AppError.forbidden('You can only edit your own messages');
    }

    if (msg.deletedAt) {
      throw AppError.badRequest('Cannot edit a deleted message');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        body,
        editedAt: new Date(),
      },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
      },
    });

    return this.formatMessageDto(updated);
  }

  async delete(
    messageId: string,
    userId: string,
  ): Promise<{ conversationId: string; messageId: string; deletedBy: string }> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { memberships: true } } },
    });

    if (!msg) {
      throw AppError.notFound('Message not found');
    }

    // Check if user is author OR conversation admin/owner
    const isAuthor = msg.senderId === userId;
    if (!isAuthor) {
      const member = msg.conversation?.memberships?.find((m: any) => m.userId === userId);
      const isStaff = member && (member.role === 'ADMIN' || member.role === 'OWNER');
      if (!isStaff) {
        throw AppError.forbidden('You do not have permission to delete this message');
      }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    return {
      conversationId: msg.conversationId,
      messageId: msg.id,
      deletedBy: userId,
    };
  }

  async toggleReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<{ messageId: string; emoji: string; added: boolean }> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!msg) {
      throw AppError.notFound('Message not found');
    }

    // Check membership
    const isMember = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId: msg.conversationId } },
    });

    if (!isMember) {
      throw AppError.forbidden('Not a member of this conversation');
    }

    const existing = await prisma.reaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    if (existing) {
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
      return { messageId, emoji, added: false };
    }

    await prisma.reaction.create({
      data: {
        id: generateId(),
        messageId,
        userId,
        emoji,
      },
    });

    return { messageId, emoji, added: true };
  }

  async getMissedMessages(
    userId: string,
    lastMessageIds: Record<string, string>,
  ): Promise<Record<string, MessageDto[]>> {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = memberships.map((m) => m.conversationId);
    const result: Record<string, MessageDto[]> = {};

    for (const convId of conversationIds) {
      const lastKnownId = lastMessageIds[convId];
      const whereClause: any = {
        conversationId: convId,
      };

      if (lastKnownId) {
        whereClause.id = { gt: lastKnownId };
      }

      const missed = await prisma.message.findMany({
        where: whereClause,
        orderBy: { id: 'asc' },
        take: 100,
        include: {
          sender: true,
          replyTo: { include: { sender: true } },
          attachments: true,
          reactions: true,
        },
      });

      if (missed.length > 0) {
        result[convId] = missed.map((m) => this.formatMessageDto(m));
      }
    }

    return result;
  }

  async getThread(
    rootMessageId: string,
    userId: string,
  ): Promise<{ root: MessageDto; replies: MessageDto[] }> {
    const root = await prisma.message.findUnique({
      where: { id: rootMessageId },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
        savedBy: { where: { userId } },
      },
    });

    if (!root) {
      throw AppError.notFound('Root thread message not found');
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId: root.conversationId } },
    });
    if (!membership) {
      throw AppError.forbidden('You are not a member of this conversation');
    }

    const replies = await prisma.message.findMany({
      where: {
        replyToId: rootMessageId,
        deletedAt: null,
      },
      orderBy: { id: 'asc' },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
        savedBy: { where: { userId } },
      },
    });

    return {
      root: this.formatMessageDto(root),
      replies: replies.map((r) => this.formatMessageDto(r)),
    };
  }

  async togglePin(
    messageId: string,
    userId: string,
    pinned: boolean,
  ): Promise<{ conversationId: string; messageId: string; pinned: boolean; pinnedAt: string | null; pinnedBy: string | null }> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!msg) throw AppError.notFound('Message not found');

    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId: msg.conversationId } },
    });
    if (!membership) throw AppError.forbidden('Not a member of this conversation');

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        pinnedAt: pinned ? new Date() : null,
        pinnedById: pinned ? userId : null,
      },
    });

    return {
      conversationId: msg.conversationId,
      messageId: msg.id,
      pinned,
      pinnedAt: updated.pinnedAt ? updated.pinnedAt.toISOString() : null,
      pinnedBy: updated.pinnedById,
    };
  }

  async getPinnedMessages(conversationId: string, userId: string): Promise<MessageDto[]> {
    const membership = await prisma.membership.findUnique({
      where: { userId_conversationId: { userId, conversationId } },
    });
    if (!membership) throw AppError.forbidden('Not a member of this conversation');

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        pinnedAt: { not: null },
        deletedAt: null,
      },
      orderBy: { pinnedAt: 'desc' },
      include: {
        sender: true,
        replyTo: { include: { sender: true } },
        attachments: true,
        reactions: true,
        savedBy: { where: { userId } },
      },
    });

    return messages.map((m) => this.formatMessageDto(m));
  }

  async toggleSave(
    messageId: string,
    userId: string,
    saved: boolean,
  ): Promise<{ messageId: string; isSaved: boolean }> {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw AppError.notFound('Message not found');

    if (saved) {
      await prisma.savedMessage.upsert({
        where: { userId_messageId: { userId, messageId } },
        create: { id: generateId(), userId, messageId },
        update: {},
      });
    } else {
      await prisma.savedMessage.deleteMany({
        where: { userId, messageId },
      });
    }

    return { messageId, isSaved: saved };
  }

  async getSavedMessages(userId: string): Promise<MessageDto[]> {
    const saved = await prisma.savedMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: true,
            replyTo: { include: { sender: true } },
            attachments: true,
            reactions: true,
            savedBy: { where: { userId } },
          },
        },
      },
    });

    return saved.map((s) => this.formatMessageDto(s.message));
  }

  async votePoll(
    messageId: string,
    userId: string,
    optionIndex: number,
  ): Promise<any> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!msg || !msg.metadata) throw AppError.badRequest('Not a valid poll message');

    let pollData: any;
    try {
      pollData = JSON.parse(msg.metadata);
    } catch {
      throw AppError.badRequest('Invalid poll data');
    }

    if (!pollData || pollData.type !== 'poll' || !Array.isArray(pollData.options)) {
      throw AppError.badRequest('Message is not an interactive poll');
    }

    const existingVote = await prisma.pollVote.findUnique({
      where: { messageId_userId: { messageId, userId } },
    });

    if (existingVote && existingVote.optionIndex === optionIndex) {
      // Toggle remove vote
      await prisma.pollVote.delete({ where: { id: existingVote.id } });
    } else if (existingVote) {
      // Switch vote
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionIndex },
      });
    } else {
      // New vote
      await prisma.pollVote.create({
        data: {
          id: generateId(),
          messageId,
          userId,
          optionIndex,
        },
      });
    }

    // Recompute poll counts
    const allVotes = await prisma.pollVote.findMany({
      where: { messageId },
    });

    const updatedOptions = pollData.options.map((opt: any, idx: number) => {
      const optionVotes = allVotes.filter((v) => v.optionIndex === idx);
      return {
        index: idx,
        text: typeof opt === 'string' ? opt : opt.text,
        votes: optionVotes.length,
        voterIds: optionVotes.map((v) => v.userId),
        userVoted: optionVotes.some((v) => v.userId === userId),
      };
    });

    const pollDto = {
      question: pollData.question || 'Poll',
      options: updatedOptions,
      totalVotes: allVotes.length,
    };

    return pollDto;
  }
}

export const messageService = new MessageService();
