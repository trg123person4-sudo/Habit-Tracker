import {
  MessageDto,
  MembershipDto,
  PresenceStatus,
  SocketResponse,
  SyncResultDto,
} from './types.js';

export interface ClientToServerEvents {
  'message:send': (
    payload: {
      conversationId: string;
      clientMessageId: string;
      body: string;
      replyToId?: string;
      attachmentIds?: string[];
      metadata?: string;
    },
    callback?: (res: SocketResponse<MessageDto>) => void,
  ) => void;

  'thread:reply': (
    payload: {
      rootMessageId: string;
      clientMessageId: string;
      body: string;
      attachmentIds?: string[];
      metadata?: string;
    },
    callback?: (res: SocketResponse<MessageDto>) => void,
  ) => void;

  'message:pin': (
    payload: { messageId: string; pinned: boolean },
    callback?: (res: SocketResponse<{ messageId: string; pinned: boolean; pinnedAt: string | null }>) => void,
  ) => void;

  'message:poll_vote': (
    payload: { messageId: string; optionIndex: number },
    callback?: (res: SocketResponse<{ messageId: string; poll: import('./types.js').PollDto }>) => void,
  ) => void;

  'message:save': (
    payload: { messageId: string; saved: boolean },
    callback?: (res: SocketResponse<{ messageId: string; isSaved: boolean }>) => void,
  ) => void;

  'message:effect': (
    payload: { conversationId: string; messageId: string; effect: string },
    callback?: (res: SocketResponse<void>) => void,
  ) => void;

  'message:edit': (
    payload: { messageId: string; body: string },
    callback?: (res: SocketResponse<MessageDto>) => void,
  ) => void;

  'message:delete': (
    payload: { messageId: string },
    callback?: (res: SocketResponse<{ messageId: string }>) => void,
  ) => void;

  'reaction:toggle': (
    payload: { messageId: string; emoji: string },
    callback?: (res: SocketResponse<{ messageId: string; emoji: string; added: boolean }>) => void,
  ) => void;

  'typing:start': (
    payload: { conversationId: string },
    callback?: (res: SocketResponse<void>) => void,
  ) => void;

  'typing:stop': (
    payload: { conversationId: string },
    callback?: (res: SocketResponse<void>) => void,
  ) => void;

  'conversation:read': (
    payload: { conversationId: string; messageId: string },
    callback?: (
      res: SocketResponse<{
        conversationId: string;
        lastReadMessageId: string;
        unreadCount: number;
      }>,
    ) => void,
  ) => void;

  'conversation:join': (
    payload: { conversationId: string },
    callback?: (res: SocketResponse<{ conversationId: string }>) => void,
  ) => void;

  'conversation:leave': (
    payload: { conversationId: string },
    callback?: (res: SocketResponse<{ conversationId: string }>) => void,
  ) => void;

  'presence:heartbeat': (callback?: (res: SocketResponse<void>) => void) => void;

  sync: (
    payload: { lastMessageIds: Record<string, string> },
    callback?: (res: SocketResponse<SyncResultDto>) => void,
  ) => void;
}

export interface ServerToClientEvents {
  'message:created': (message: MessageDto) => void;
  'message:updated': (message: MessageDto) => void;
  'message:deleted': (payload: {
    conversationId: string;
    messageId: string;
    deletedBy: string;
  }) => void;
  'reaction:updated': (payload: {
    conversationId: string;
    messageId: string;
    emoji: string;
    userId: string;
    added: boolean;
  }) => void;
  'typing:user': (payload: {
    conversationId: string;
    userId: string;
    username: string;
    isTyping: boolean;
  }) => void;
  'presence:updated': (payload: {
    userId: string;
    status: PresenceStatus;
    lastSeenAt?: string;
  }) => void;
  'conversation:read_updated': (payload: {
    conversationId: string;
    userId: string;
    lastReadMessageId: string;
  }) => void;
  'conversation:member_joined': (payload: {
    conversationId: string;
    member: MembershipDto;
  }) => void;
  'conversation:member_left': (payload: { conversationId: string; userId: string }) => void;
  'conversation:member_kicked': (payload: { conversationId: string; userId: string }) => void;
  'message:pinned': (payload: {
    conversationId: string;
    messageId: string;
    pinned: boolean;
    pinnedAt: string | null;
    pinnedBy: string | null;
  }) => void;
  'message:poll_updated': (payload: {
    conversationId: string;
    messageId: string;
    poll: import('./types.js').PollDto;
  }) => void;
  'thread:updated': (payload: {
    conversationId: string;
    rootMessageId: string;
    replyCount: number;
    lastReplyAt: string;
    reply: MessageDto;
  }) => void;
  'message:effect': (payload: {
    conversationId: string;
    messageId: string;
    effect: string;
  }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}
