import { useEffect, useRef, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useChatStore } from '../../stores/chat-store.js';
import { api } from '../../lib/api-client.js';
import { MessageItem } from './MessageItem.js';
import { formatDividerDate } from '../../lib/utils.js';
import { MessageDto } from '@realtime-chat/shared';
import { ArrowDown, MessageSquare } from 'lucide-react';

interface MessageListProps {
  conversationId: string;
}

export function MessageList({ conversationId }: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const { messages, setMessages, prependOlderMessages } = useChatStore();
  const [atBottom, setAtBottom] = useState(true);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const conversationMessages = messages[conversationId] || [];

  // Initial load of messages for conversation
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      try {
        const res = await api.get<{ messages: MessageDto[]; hasMore: boolean }>(
          `/conversations/${conversationId}/messages?limit=50&direction=older`,
        );
        if (isMounted) {
          setMessages(conversationId, res.messages);
          setHasMoreOlder(res.hasMore);
        }
      } catch (err) {
        console.error('Failed to load initial messages', err);
      }
    }

    if (!messages[conversationId]) {
      loadInitial();
    }

    return () => {
      isMounted = false;
    };
  }, [conversationId, messages, setMessages]);

  // Infinite scroll upward (load older messages)
  const handleStartReached = async () => {
    if (!hasMoreOlder || loadingOlder || conversationMessages.length === 0) return;

    const oldest = conversationMessages[0];
    if (!oldest) return;

    setLoadingOlder(true);
    try {
      const res = await api.get<{ messages: MessageDto[]; hasMore: boolean }>(
        `/conversations/${conversationId}/messages?cursor=${oldest.id}&direction=older&limit=50`,
      );

      prependOlderMessages(conversationId, res.messages);
      setHasMoreOlder(res.hasMore);
    } catch (err) {
      console.error('Failed to load older messages', err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const scrollToBottom = () => {
    virtuosoRef.current?.scrollToIndex({
      index: conversationMessages.length - 1,
      behavior: 'smooth',
    });
  };

  if (conversationMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none text-slate-500">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-3 border border-slate-800 text-slate-400">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300 mb-1">No messages yet</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Be the first to send a message and start the conversation in this room.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden bg-slate-950" role="log" aria-live="polite">
      <Virtuoso
        ref={virtuosoRef}
        data={conversationMessages}
        startReached={handleStartReached}
        atBottomStateChange={setAtBottom}
        followOutput="smooth"
        initialTopMostItemIndex={conversationMessages.length - 1}
        className="h-full scrollbar-thin"
        itemContent={(index, msg) => {
          const prevMsg = index > 0 ? conversationMessages[index - 1] : null;

          // 1. Check Date Separator
          const msgDate = new Date(msg.createdAt).toDateString();
          const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
          const showDateDivider = msgDate !== prevDate;

          // 2. Check 5-Minute Sender Grouping
          const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
          const timeDiffMs = prevMsg
            ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
            : Infinity;
          const isWithin5Min = timeDiffMs < 5 * 60 * 1000;
          const isGrouped = Boolean(
            !showDateDivider && isSameSender && isWithin5Min && !prevMsg?.deletedAt,
          );

          return (
            <div>
              {showDateDivider && (
                <div className="flex items-center my-4 px-4 select-none">
                  <div className="flex-1 border-t border-slate-800" />
                  <span className="px-3 text-[11px] font-semibold text-slate-500 bg-slate-950">
                    {formatDividerDate(msg.createdAt)}
                  </span>
                  <div className="flex-1 border-t border-slate-800" />
                </div>
              )}

              <MessageItem message={msg} isGrouped={isGrouped} />
            </div>
          );
        }}
      />

      {/* Jump to Latest Floating Button */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all z-10 select-none animate-bounce"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Jump to latest</span>
        </button>
      )}
    </div>
  );
}
