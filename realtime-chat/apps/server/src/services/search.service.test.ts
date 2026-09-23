import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from './search.service.js';
import { prisma } from '../db/client.js';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  it('rejects search query shorter than 2 characters', async () => {
    await expect(searchService.searchGlobal('user_1', 'a')).rejects.toThrow(
      'Search query must be at least 2 characters long',
    );
  });

  it('returns highlighted search results for matching messages', async () => {
    vi.spyOn(prisma.membership, 'findMany').mockImplementation(async () => {
      return [{ conversationId: 'conv_1' }] as any;
    });

    vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('no tsvector in mock'));

    vi.spyOn(prisma.message, 'findMany').mockImplementation(async () => {
      return [
        {
          id: 'msg_1',
          conversationId: 'conv_1',
          senderId: 'user_alice',
          body: 'Deploying the Kubernetes cluster this afternoon',
          replyToId: null,
          clientMessageId: 'c1',
          editedAt: null,
          deletedAt: null,
          deletedBy: null,
          createdAt: new Date(),
          sender: {
            id: 'user_alice',
            username: 'alice',
            displayName: 'Alice',
            avatarUrl: null,
            statusMessage: null,
          },
          conversation: {
            id: 'conv_1',
            name: 'devops',
            type: 'CHANNEL',
          },
          attachments: [],
          reactions: [],
        },
      ] as any;
    });

    const results = await searchService.searchGlobal('user_alice', 'Kubernetes');
    expect(results).toHaveLength(1);
    expect(results[0].message.id).toBe('msg_1');
    expect(results[0].highlight).toContain('<mark');
    expect(results[0].highlight).toContain('Kubernetes');
    expect(results[0].conversation.name).toBe('devops');
  });
});
