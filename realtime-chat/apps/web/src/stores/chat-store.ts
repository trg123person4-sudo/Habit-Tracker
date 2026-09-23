import { create } from 'zustand';
import { ConversationDto, MessageDto, MembershipDto, PollDto } from '@realtime-chat/shared';
import { getSocket } from '../lib/socket-client.js';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';

export interface OutboxItem {
  conversationId: string;
  clientMessageId: string;
  body: string;
  attachmentIds?: string[];
  replyToId?: string;
  metadata?: any;
}

interface ChatState {
  conversations: ConversationDto[];
  activeConversationId: string | null;
  messages: Record<string, MessageDto[]>;
  connectionStatus: ConnectionStatus;
  isDetailsOpen: boolean;
  isMobileDrawerOpen: boolean;
  isQuickSwitcherOpen: boolean;

  // Next-Gen Modals & Panels
  activeThreadMessage: MessageDto | null;
  threadReplies: MessageDto[];
  isCatchUpOpen: boolean;
  isPinnedOpen: boolean;
  isSavedOpen: boolean;
  confettiTriggerKey: number;

  // Offline Outbox
  outbox: OutboxItem[];

  typingUsers: Record<string, { userId: string; username: string }[]>;
  presences: Record<string, 'online' | 'offline'>;
  replyingTo: MessageDto | null;
  editingMessageId: string | null;

  setConversations: (convs: ConversationDto[]) => void;
  setActiveConversationId: (id: string | null) => void;
  removeConversation: (conversationId: string) => void;
  removeMemberFromConversation: (conversationId: string, memberId: string) => void;
  updateMemberInConversation: (
    conversationId: string,
    memberId: string,
    updates: Partial<MembershipDto>,
  ) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  toggleDetails: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setQuickSwitcherOpen: (open: boolean) => void;

  // Threads
  openThread: (message: MessageDto) => void;
  closeThread: () => void;
  setThreadReplies: (replies: MessageDto[]) => void;
  addThreadReply: (reply: MessageDto) => void;

  // Modals & Effects
  setCatchUpOpen: (open: boolean) => void;
  setPinnedOpen: (open: boolean) => void;
  setSavedOpen: (open: boolean) => void;
  triggerConfetti: () => void;

  // Outbox
  enqueueOutbox: (item: OutboxItem) => void;
  removeOutbox: (clientMessageId: string) => void;
  flushOutbox: () => void;

  // Next-Gen Message State
  toggleMessagePin: (
    conversationId: string,
    messageId: string,
    pinnedAt: string | null,
    pinnedById: string | null,
  ) => void;
  toggleMessageSave: (messageId: string, isSaved: boolean) => void;
  updatePollVote: (messageId: string, poll: PollDto) => void;

  setTypingUser: (
    conversationId: string,
    userId: string,
    username: string,
    isTyping: boolean,
  ) => void;
  setPresence: (userId: string, status: 'online' | 'offline') => void;
  setPresences: (presences: Record<string, 'online' | 'offline'>) => void;
  setReplyingTo: (message: MessageDto | null) => void;
  setEditingMessageId: (id: string | null) => void;
  markConversationReadLocally: (conversationId: string) => void;

  setMessages: (conversationId: string, messages: MessageDto[]) => void;
  prependOlderMessages: (conversationId: string, olderMessages: MessageDto[]) => void;
  addMessage: (message: MessageDto) => void;
  updateMessage: (message: MessageDto) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  updateMessageStatus: (
    conversationId: string,
    clientMessageId: string,
    status: 'pending' | 'sent' | 'failed',
    serverMessage?: MessageDto,
  ) => void;
  updateReaction: (
    conversationId: string,
    messageId: string,
    emoji: string,
    userId: string,
    added: boolean,
  ) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  connectionStatus: 'connected',
  isDetailsOpen: false,
  isMobileDrawerOpen: false,
  isQuickSwitcherOpen: false,

  activeThreadMessage: null,
  threadReplies: [],
  isCatchUpOpen: false,
  isPinnedOpen: false,
  isSavedOpen: false,
  confettiTriggerKey: 0,
  outbox: [],

  typingUsers: {},
  presences: {},
  replyingTo: null,
  editingMessageId: null,

  setConversations: (conversations) => set({ conversations }),

  setActiveConversationId: (activeConversationId) =>
    set((state) => {
      // Clear unread count for the active conversation
      const updated = state.conversations.map((c) =>
        c.id === activeConversationId ? { ...c, unreadCount: 0 } : c,
      );
      return {
        activeConversationId,
        conversations: updated,
        isMobileDrawerOpen: false,
        replyingTo: null,
      };
    }),

  removeConversation: (conversationId) =>
    set((state) => {
      const filtered = state.conversations.filter((c) => c.id !== conversationId);
      const newActive =
        state.activeConversationId === conversationId
          ? filtered[0]?.id || null
          : state.activeConversationId;
      return {
        conversations: filtered,
        activeConversationId: newActive,
      };
    }),

  removeMemberFromConversation: (conversationId, memberIdOrUserId) =>
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          members: (c.members || []).filter(
            (m) => m.id !== memberIdOrUserId && m.userId !== memberIdOrUserId,
          ),
        };
      }),
    })),

  updateMemberInConversation: (conversationId, memberIdOrUserId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          members: (c.members || []).map((m) =>
            m.id === memberIdOrUserId || m.userId === memberIdOrUserId ? { ...m, ...updates } : m,
          ),
        };
      }),
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  toggleDetails: () => set((state) => ({ isDetailsOpen: !state.isDetailsOpen })),

  setMobileDrawerOpen: (isMobileDrawerOpen) => set({ isMobileDrawerOpen }),

  setQuickSwitcherOpen: (isQuickSwitcherOpen) => set({ isQuickSwitcherOpen }),

  // Threads
  openThread: (message) => set({ activeThreadMessage: message, threadReplies: [] }),
  closeThread: () => set({ activeThreadMessage: null, threadReplies: [] }),
  setThreadReplies: (replies) => set({ threadReplies: replies }),
  addThreadReply: (reply) =>
    set((state) => {
      // 1. Add to active thread replies if open
      const currentReplies = state.threadReplies;
      const alreadyHas = currentReplies.some((r) => r.id === reply.id);
      const updatedReplies = alreadyHas ? currentReplies : [...currentReplies, reply];

      // 2. Update parent message replyCount and lastReplyAt
      const parentId = reply.replyToId;
      let updatedParent = state.activeThreadMessage;
      if (updatedParent && updatedParent.id === parentId) {
        updatedParent = {
          ...updatedParent,
          replyCount: (updatedParent.replyCount || 0) + (alreadyHas ? 0 : 1),
          lastReplyAt: reply.createdAt,
        };
      }

      // 3. Update parent message in general messages list
      const convId = reply.conversationId;
      const convMsgs = state.messages[convId] || [];
      const updatedConvMsgs = convMsgs.map((m) => {
        if (m.id === parentId) {
          return {
            ...m,
            replyCount: (m.replyCount || 0) + (alreadyHas ? 0 : 1),
            lastReplyAt: reply.createdAt,
          };
        }
        return m;
      });

      return {
        threadReplies: updatedReplies,
        activeThreadMessage: updatedParent,
        messages: {
          ...state.messages,
          [convId]: updatedConvMsgs,
        },
      };
    }),

  // Modals & Effects
  setCatchUpOpen: (isCatchUpOpen) => set({ isCatchUpOpen }),
  setPinnedOpen: (isPinnedOpen) => set({ isPinnedOpen }),
  setSavedOpen: (isSavedOpen) => set({ isSavedOpen }),
  triggerConfetti: () => set((state) => ({ confettiTriggerKey: state.confettiTriggerKey + 1 })),

  // Outbox Offline Handling
  enqueueOutbox: (item) =>
    set((state) => ({
      outbox: [...state.outbox.filter((o) => o.clientMessageId !== item.clientMessageId), item],
    })),

  removeOutbox: (clientMessageId) =>
    set((state) => ({
      outbox: state.outbox.filter((o) => o.clientMessageId !== clientMessageId),
    })),

  flushOutbox: () => {
    const { outbox, updateMessageStatus, removeOutbox } = get();
    if (outbox.length === 0) return;

    const socket = getSocket();
    if (!socket || !socket.connected) return;

    // Send all queued outbox items
    [...outbox].forEach((item) => {
      socket.emit(
        'message:send',
        {
          conversationId: item.conversationId,
          clientMessageId: item.clientMessageId,
          body: item.body,
          ...(item.attachmentIds && item.attachmentIds.length > 0
            ? { attachmentIds: item.attachmentIds }
            : {}),
          ...(item.replyToId ? { replyToId: item.replyToId } : {}),
          ...(item.metadata ? { metadata: item.metadata } : {}),
        },
        (res) => {
          if (res.ok && res.data) {
            updateMessageStatus(item.conversationId, item.clientMessageId, 'sent', res.data);
            removeOutbox(item.clientMessageId);
          } else {
            updateMessageStatus(item.conversationId, item.clientMessageId, 'failed');
          }
        },
      );
    });
  },

  // Next-Gen Message State
  toggleMessagePin: (conversationId, messageId, pinnedAt, pinnedById) =>
    set((state) => {
      const convMsgs = state.messages[conversationId] || [];
      const updatedConvMsgs = convMsgs.map((m) =>
        m.id === messageId ? { ...m, pinnedAt, pinnedById } : m,
      );

      let updatedActive = state.activeThreadMessage;
      if (updatedActive && updatedActive.id === messageId) {
        updatedActive = { ...updatedActive, pinnedAt, pinnedById };
      }

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedConvMsgs,
        },
        activeThreadMessage: updatedActive,
      };
    }),

  toggleMessageSave: (messageId, isSaved) =>
    set((state) => {
      const newMessages = { ...state.messages };
      for (const convId of Object.keys(newMessages)) {
        newMessages[convId] = newMessages[convId].map((m) =>
          m.id === messageId ? { ...m, isSaved } : m,
        );
      }
      return { messages: newMessages };
    }),

  updatePollVote: (messageId, poll) =>
    set((state) => {
      const helper = (existingMeta: string | null | undefined): string => {
        try {
          const parsed = existingMeta ? JSON.parse(existingMeta) : {};
          parsed.poll = poll;
          return JSON.stringify(parsed);
        } catch {
          return JSON.stringify({ poll });
        }
      };

      const newMessages = { ...state.messages };
      for (const convId of Object.keys(newMessages)) {
        newMessages[convId] = newMessages[convId].map((m) =>
          m.id === messageId
            ? {
                ...m,
                metadata: helper(m.metadata),
              }
            : m,
        );
      }

      let updatedActive = state.activeThreadMessage;
      if (updatedActive && updatedActive.id === messageId) {
        updatedActive = {
          ...updatedActive,
          metadata: helper(updatedActive.metadata),
        };
      }

      return {
        messages: newMessages,
        activeThreadMessage: updatedActive,
      };
    }),

  setTypingUser: (conversationId, userId, username, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      let updated: { userId: string; username: string }[];

      if (isTyping) {
        if (!current.some((u) => u.userId === userId)) {
          updated = [...current, { userId, username }];
        } else {
          updated = current;
        }
      } else {
        updated = current.filter((u) => u.userId !== userId);
      }

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),

  setPresence: (userId, status) =>
    set((state) => ({
      presences: {
        ...state.presences,
        [userId]: status,
      },
    })),

  setPresences: (presences) =>
    set((state) => ({
      presences: {
        ...state.presences,
        ...presences,
      },
    })),

  setReplyingTo: (replyingTo) => set({ replyingTo }),

  setEditingMessageId: (editingMessageId) => set({ editingMessageId }),

  markConversationReadLocally: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  prependOlderMessages: (conversationId, olderMessages) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      const existingIds = new Set(existing.map((m) => m.id));
      const filteredOlder = olderMessages.filter((m) => !existingIds.has(m.id));

      return {
        messages: {
          ...state.messages,
          [conversationId]: [...filteredOlder, ...existing],
        },
      };
    }),

  addMessage: (message) =>
    set((state) => {
      const convId = message.conversationId;
      const current = state.messages[convId] || [];

      // Check if optimistic message with same clientMessageId exists
      const existingIndex = current.findIndex(
        (m) => m.clientMessageId === message.clientMessageId,
      );

      let updatedMessages: MessageDto[];
      if (existingIndex !== -1) {
        updatedMessages = [...current];
        updatedMessages[existingIndex] = { ...message, status: 'sent' };
      } else {
        if (!current.some((m) => m.id === message.id)) {
          updatedMessages = [...current, { ...message, status: 'sent' }];
        } else {
          updatedMessages = current;
        }
      }

      const updatedConvs = state.conversations.map((c) => {
        if (c.id === convId) {
          const isCurrentActive = state.activeConversationId === convId;
          return {
            ...c,
            lastMessage: message,
            unreadCount: isCurrentActive ? 0 : (c.unreadCount || 0) + 1,
          };
        }
        return c;
      });

      return {
        messages: {
          ...state.messages,
          [convId]: updatedMessages,
        },
        conversations: updatedConvs,
      };
    }),

  updateMessage: (message) =>
    set((state) => {
      const convId = message.conversationId;
      const current = state.messages[convId] || [];
      return {
        messages: {
          ...state.messages,
          [convId]: current.map((m) => (m.id === message.id ? { ...message, status: 'sent' } : m)),
        },
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => {
      const current = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  body: 'This message was deleted',
                  deletedAt: new Date().toISOString(),
                }
              : m,
          ),
        },
      };
    }),

  updateMessageStatus: (conversationId, clientMessageId, status, serverMessage) =>
    set((state) => {
      const current = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) => {
            if (m.clientMessageId === clientMessageId) {
              if (serverMessage && status === 'sent') {
                return { ...serverMessage, status: 'sent' };
              }
              return { ...m, status };
            }
            return m;
          }),
        },
      };
    }),

  updateReaction: (conversationId, messageId, emoji, userId, added) =>
    set((state) => {
      const current = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: current.map((m) => {
            if (m.id !== messageId) return m;

            const existingReactions = [...m.reactions];
            const reactionIndex = existingReactions.findIndex((r) => r.emoji === emoji);

            if (added) {
              if (reactionIndex !== -1) {
                const r = existingReactions[reactionIndex];
                if (!r.userIds.includes(userId)) {
                  existingReactions[reactionIndex] = {
                    ...r,
                    count: r.count + 1,
                    userIds: [...r.userIds, userId],
                  };
                }
              } else {
                existingReactions.push({
                  emoji,
                  count: 1,
                  userIds: [userId],
                  hasReacted: false,
                });
              }
            } else {
              if (reactionIndex !== -1) {
                const r = existingReactions[reactionIndex];
                const newUserIds = r.userIds.filter((id) => id !== userId);
                if (newUserIds.length === 0) {
                  existingReactions.splice(reactionIndex, 1);
                } else {
                  existingReactions[reactionIndex] = {
                    ...r,
                    count: newUserIds.length,
                    userIds: newUserIds,
                  };
                }
              }
            }

            return { ...m, reactions: existingReactions };
          }),
        },
      };
    }),
}));
