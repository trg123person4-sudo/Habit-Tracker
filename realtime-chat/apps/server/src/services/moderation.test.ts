import { describe, it, expect, beforeEach, vi } from 'vitest';
import { conversationService } from './conversation.service.js';
import { messageService } from './message.service.js';
import { prisma } from '../db/client.js';

describe('Moderation (Kick / Mute)', () => {
  const convId = 'conv_ops';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows owner to kick member and removes their membership', async () => {
    vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async ({ where }: any) => {
      const { userId } = where.userId_conversationId;
      if (userId === 'user_owner') {
        return { id: 'm_owner', role: 'OWNER', userId: 'user_owner', conversationId: convId } as any;
      }
      if (userId === 'user_spammer') {
        return { id: 'm_spammer', role: 'MEMBER', userId: 'user_spammer', conversationId: convId } as any;
      }
      return null;
    });

    const deleteSpy = vi.spyOn(prisma.membership, 'delete').mockResolvedValue({} as any);

    const result = await conversationService.kickMember(convId, 'user_owner', 'user_spammer');
    expect(result.success).toBe(true);
    expect(result.userId).toBe('user_spammer');
    expect(deleteSpy).toHaveBeenCalledWith({ where: { id: 'm_spammer' } });
  });

  it('prevents non-owner/admin from kicking members', async () => {
    vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async ({ where }: any) => {
      const { userId } = where.userId_conversationId;
      if (userId === 'user_member1') {
        return { id: 'm_m1', role: 'MEMBER', userId: 'user_member1', conversationId: convId } as any;
      }
      return null;
    });

    await expect(
      conversationService.kickMember(convId, 'user_member1', 'user_member2'),
    ).rejects.toThrow('Only channel owners or admins can kick members');
  });

  it('prevents kicking the channel owner', async () => {
    vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async ({ where }: any) => {
      const { userId } = where.userId_conversationId;
      if (userId === 'user_admin') {
        return { id: 'm_admin', role: 'ADMIN', userId: 'user_admin', conversationId: convId } as any;
      }
      if (userId === 'user_owner') {
        return { id: 'm_owner', role: 'OWNER', userId: 'user_owner', conversationId: convId } as any;
      }
      return null;
    });

    await expect(
      conversationService.kickMember(convId, 'user_admin', 'user_owner'),
    ).rejects.toThrow('Cannot kick the channel owner');
  });

  it('mutes member and prevents muted user from sending messages', async () => {
    const futureDate = new Date(Date.now() + 30 * 60 * 1000);

    vi.spyOn(prisma.membership, 'findUnique').mockImplementation(async ({ where }: any) => {
      const { userId } = where.userId_conversationId;
      if (userId === 'user_owner') {
        return { id: 'm_owner', role: 'OWNER', userId: 'user_owner', conversationId: convId } as any;
      }
      if (userId === 'user_disruptive') {
        return {
          id: 'm_disruptive',
          role: 'MEMBER',
          userId: 'user_disruptive',
          conversationId: convId,
          mutedUntil: futureDate,
        } as any;
      }
      return null;
    });

    vi.spyOn(prisma.membership, 'update').mockResolvedValue({} as any);

    // Mute member
    const muteResult = await conversationService.muteMember(convId, 'user_owner', 'user_disruptive', 30);
    expect(muteResult.userId).toBe('user_disruptive');

    // Attempt to send message while muted
    await expect(
      messageService.create('user_disruptive', {
        conversationId: convId,
        clientMessageId: 'c_fail',
        body: 'Spamming while muted',
      }),
    ).rejects.toThrow('You are muted in this conversation');
  });
});
