import { useEffect } from 'react';
import { getSocket } from '../lib/socket-client.js';
import { useChatStore } from '../stores/chat-store.js';
import { useAuthStore } from '../stores/auth-store.js';
import { soundService } from '../lib/sound-service.js';

export function useSocket() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    addMessage,
    updateMessage,
    removeMessage,
    updateReaction,
    setConnectionStatus,
    setTypingUser,
    setPresence,
    addThreadReply,
    toggleMessagePin,
    updatePollVote,
    triggerConfetti,
    flushOutbox,
  } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    function onConnect() {
      setConnectionStatus('connected');

      // Auto-drain offline queue
      flushOutbox();

      // Reconnect catch-up sync: find the newest message ID for each conversation
      const currentMessages = useChatStore.getState().messages;
      const lastMessageIds: Record<string, string> = {};

      for (const [convId, msgList] of Object.entries(currentMessages)) {
        if (msgList.length > 0) {
          const newest = msgList[msgList.length - 1];
          lastMessageIds[convId] = newest.id;
        }
      }

      socket?.emit('sync', { lastMessageIds }, (res) => {
        if (res.ok && res.data?.messages) {
          for (const [, missedList] of Object.entries(res.data.messages)) {
            for (const msg of missedList) {
              addMessage(msg);
            }
          }
        }
      });
    }

    function onDisconnect() {
      setConnectionStatus('offline');
    }

    function onConnectError() {
      setConnectionStatus('reconnecting');
    }

    // 30s Heartbeat for presence TTL
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('presence:heartbeat', () => {});
      }
    }, 30_000);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.on('message:created', (message) => {
      addMessage(message);

      // Play soft chime if sent by someone else
      if (user && message.senderId !== user.id) {
        soundService.playReceive();
      }

      // Check for celebration cues in message text
      const lower = (message.body || '').toLowerCase();
      if (
        lower.includes('shipped it') ||
        lower.includes('we shipped it') ||
        lower.includes('congratulations') ||
        lower.includes('congrats!') ||
        lower.includes('launched!')
      ) {
        triggerConfetti();
        soundService.playCelebration();
      }
    });

    socket.on('message:updated', (message) => {
      updateMessage(message);
    });

    socket.on('message:deleted', ({ conversationId, messageId }) => {
      removeMessage(conversationId, messageId);
    });

    socket.on('reaction:updated', ({ conversationId, messageId, emoji, userId, added }) => {
      updateReaction(conversationId, messageId, emoji, userId, added);
      if (added && user && userId !== user.id) {
        soundService.playReaction();
      }
    });

    // Next-Gen Socket Listeners
    socket.on('thread:updated', ({ reply }) => {
      addThreadReply(reply);
      if (user && reply.senderId !== user.id) {
        soundService.playThread();
      }
    });

    socket.on('message:pinned', ({ conversationId, messageId, pinnedAt, pinnedBy }) => {
      toggleMessagePin(conversationId, messageId, pinnedAt, pinnedBy);
      soundService.playReaction();
    });

    socket.on('message:poll_updated', ({ messageId, poll }) => {
      updatePollVote(messageId, poll);
    });

    socket.on('message:effect', ({ effect }) => {
      if (effect === 'confetti') {
        triggerConfetti();
        soundService.playCelebration();
      }
    });

    socket.on('typing:user', ({ conversationId, userId, username, isTyping }) => {
      setTypingUser(conversationId, userId, username, isTyping);

      const timerKey = `${conversationId}:${userId}`;
      if (typingTimers.has(timerKey)) {
        clearTimeout(typingTimers.get(timerKey)!);
        typingTimers.delete(timerKey);
      }

      if (isTyping) {
        // Auto-expire after 5 seconds if user disconnected or crashed
        const timer = setTimeout(() => {
          setTypingUser(conversationId, userId, username, false);
          typingTimers.delete(timerKey);
        }, 5000);
        typingTimers.set(timerKey, timer);
      }
    });

    socket.on('presence:updated', ({ userId, status }) => {
      setPresence(userId, status === 'online' ? 'online' : 'offline');
    });

    socket.on('conversation:read_updated', ({ conversationId, userId }) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && userId === currentUser.id) {
        useChatStore.getState().markConversationReadLocally(conversationId);
      }
    });

    socket.on('conversation:member_kicked', ({ conversationId, userId }) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && userId === currentUser.id) {
        useChatStore.getState().removeConversation(conversationId);
      } else {
        useChatStore.getState().removeMemberFromConversation(conversationId, userId);
      }
    });

    return () => {
      clearInterval(heartbeatInterval);
      for (const timer of typingTimers.values()) {
        clearTimeout(timer);
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('message:created');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.off('reaction:updated');
      socket.off('thread:updated');
      socket.off('message:pinned');
      socket.off('message:poll_updated');
      socket.off('message:effect');
      socket.off('typing:user');
      socket.off('presence:updated');
      socket.off('conversation:read_updated');
      socket.off('conversation:member_kicked');
    };
  }, [
    isAuthenticated,
    user,
    addMessage,
    updateMessage,
    removeMessage,
    updateReaction,
    setConnectionStatus,
    setTypingUser,
    setPresence,
    addThreadReply,
    toggleMessagePin,
    updatePollVote,
    triggerConfetti,
    flushOutbox,
  ]);
}
