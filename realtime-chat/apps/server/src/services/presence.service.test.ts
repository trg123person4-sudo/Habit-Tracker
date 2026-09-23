import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresenceService } from './presence.service.js';
import { prisma } from '../db/client.js';

describe('PresenceService', () => {
  let presenceService: PresenceService;

  beforeEach(() => {
    presenceService = new PresenceService();
    vi.spyOn(prisma.membership, 'findMany').mockImplementation(async ({ where }: any) => {
      if (where.userId === 'user_1') {
        return [{ conversationId: 'conv_1' }, { conversationId: 'conv_2' }] as any;
      }
      return [] as any;
    });
  });

  it('tracks multi-socket presence: first socket marks online, last socket marks offline', async () => {
    // 1. First socket for user_1 connects
    const connect1 = await presenceService.userConnected('user_1', 'socket_1a');
    expect(connect1.isFirstSocket).toBe(true);
    expect(connect1.roomIds).toEqual(['conv:conv_1', 'conv:conv_2']);

    let status = await presenceService.getPresence('user_1');
    expect(status).toBe('online');

    // 2. Second socket for user_1 connects (e.g. second browser tab)
    const connect2 = await presenceService.userConnected('user_1', 'socket_1b');
    expect(connect2.isFirstSocket).toBe(false);

    status = await presenceService.getPresence('user_1');
    expect(status).toBe('online');

    // 3. First socket disconnects (user closed one tab)
    const disconnect1 = await presenceService.userDisconnected('user_1', 'socket_1a');
    expect(disconnect1.isLastSocket).toBe(false);

    status = await presenceService.getPresence('user_1');
    expect(status).toBe('online'); // Still online because second tab is open!

    // 4. Second socket disconnects (user closed last tab)
    const disconnect2 = await presenceService.userDisconnected('user_1', 'socket_1b');
    expect(disconnect2.isLastSocket).toBe(true);

    status = await presenceService.getPresence('user_1');
    expect(status).toBe('offline');
  });

  it('updates heartbeat for user presence', async () => {
    await presenceService.userConnected('user_2', 'socket_2');
    await expect(presenceService.heartbeat('user_2')).resolves.not.toThrow();
    const status = await presenceService.getPresence('user_2');
    expect(status).toBe('online');
  });

  it('reports offline for untracked user', async () => {
    const status = await presenceService.getPresence('unknown_user');
    expect(status).toBe('offline');
  });
});
