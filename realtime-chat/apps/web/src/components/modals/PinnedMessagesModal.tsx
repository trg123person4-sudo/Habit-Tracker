import { useState, useEffect } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { api } from '../../lib/api-client.js';
import { getSocket } from '../../lib/socket-client.js';
import { Avatar } from '../common/Avatar.js';
import { formatMessageTime, getUserColor } from '../../lib/utils.js';
import { MessageDto } from '@realtime-chat/shared';
import { Pin, X, PinOff, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function PinnedMessagesModal() {
  const { isPinnedOpen, setPinnedOpen, activeConversationId, conversations } = useChatStore();
  const [pinnedMessages, setPinnedMessages] = useState<MessageDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (!isPinnedOpen || !activeConversationId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .get<MessageDto[]>(`/conversations/${activeConversationId}/pinned`)
      .then((res) => {
        if (isMounted) {
          setPinnedMessages(res || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load pinned messages', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isPinnedOpen, activeConversationId]);

  const handleUnpin = (messageId: string) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('message:pin', { messageId, pinned: false }, () => {
        setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
      });
    }
  };

  if (!isPinnedOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Pin className="w-4 h-4 fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Pinned Messages</h3>
              <p className="text-xs text-slate-400">#{activeConv?.name || 'conversation'}</p>
            </div>
          </div>
          <button
            onClick={() => setPinnedOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-3 scrollbar-thin select-text">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">Loading pinned messages...</span>
            </div>
          )}

          {!isLoading && pinnedMessages.length === 0 && (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <Pin className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">No pinned messages in this channel yet.</p>
              <p className="text-[11px] text-slate-600">
                Hover over any important message and click the pin icon to keep it accessible.
              </p>
            </div>
          )}

          {!isLoading &&
            pinnedMessages.map((msg) => {
              const author = msg.sender?.displayName || msg.sender?.username || 'Unknown';
              const color = getUserColor(msg.sender?.username || '');

              return (
                <div
                  key={msg.id}
                  className="group relative p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={author} src={msg.sender?.avatarUrl} size="sm" />
                      <div>
                        <span className={`text-xs font-semibold ${color}`}>{author}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnpin(msg.id)}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                      title="Unpin message"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-200 leading-relaxed break-words">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{msg.body}</ReactMarkdown>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setPinnedOpen(false)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
