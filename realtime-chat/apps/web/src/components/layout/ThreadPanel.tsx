import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chat-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { getSocket } from '../../lib/socket-client.js';
import { api } from '../../lib/api-client.js';
import { soundService } from '../../lib/sound-service.js';
import { Avatar } from '../common/Avatar.js';
import { getUserColor, formatMessageTime } from '../../lib/utils.js';
import { MessageDto } from '@realtime-chat/shared';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export function ThreadPanel() {
  const {
    activeThreadMessage,
    closeThread,
    threadReplies,
    setThreadReplies,
    addThreadReply,
  } = useChatStore();
  const { user } = useAuthStore();

  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch thread replies on open
  useEffect(() => {
    if (!activeThreadMessage) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .get<MessageDto[]>(
        `/conversations/${activeThreadMessage.conversationId}/threads/${activeThreadMessage.id}`,
      )
      .then((replies) => {
        if (isMounted) {
          setThreadReplies(replies || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load thread replies', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeThreadMessage?.id, activeThreadMessage?.conversationId, setThreadReplies]);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadReplies.length]);

  if (!activeThreadMessage) return null;

  const rootAuthor =
    activeThreadMessage.sender?.displayName ||
    activeThreadMessage.sender?.username ||
    'Unknown';
  const rootColor = getUserColor(activeThreadMessage.sender?.username || '');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    const clientMessageId = crypto.randomUUID();
    const tempId = `thread_opt_${clientMessageId}`;

    // Optimistic thread reply
    const optimisticReply: MessageDto = {
      id: tempId,
      conversationId: activeThreadMessage.conversationId,
      senderId: user.id,
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
      },
      body: trimmed,
      replyToId: activeThreadMessage.id,
      replyTo: {
        id: activeThreadMessage.id,
        sender: activeThreadMessage.sender,
        body: activeThreadMessage.body,
      },
      clientMessageId,
      editedAt: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date().toISOString(),
      attachments: [],
      reactions: [],
      status: 'pending',
    };

    addThreadReply(optimisticReply);
    setText('');
    soundService.playSend();

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(
        'thread:reply',
        {
          rootMessageId: activeThreadMessage.id,
          body: trimmed,
          clientMessageId,
        },
        () => {},
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="w-80 sm:w-96 flex flex-col h-full bg-slate-900/95 border-l border-slate-800 shadow-2xl z-20 shrink-0 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">Thread</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <button
          onClick={closeThread}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Thread"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Root Message Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 shadow-md">
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar name={rootAuthor} src={activeThreadMessage.sender?.avatarUrl} size="sm" />
            <div className="truncate">
              <span className={`text-xs font-semibold ${rootColor}`}>{rootAuthor}</span>
              <div className="text-[10px] text-slate-500">
                {formatMessageTime(activeThreadMessage.createdAt)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed break-words prose prose-invert prose-xs max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {activeThreadMessage.body}
            </ReactMarkdown>
          </div>
        </div>

        {/* Divider with replies count */}
        <div className="relative flex items-center justify-center my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Replies
          </span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-2" />
            <span className="text-xs">Loading replies...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && threadReplies.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500">
            No replies in this thread yet. Start the conversation!
          </div>
        )}

        {/* Thread Replies List */}
        {!isLoading &&
          threadReplies.map((reply) => {
            const author = reply.sender?.displayName || reply.sender?.username || 'Unknown';
            const color = getUserColor(reply.sender?.username || '');

            return (
              <div
                key={reply.id}
                className="flex gap-2.5 group p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                <Avatar name={author} src={reply.sender?.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-xs font-semibold ${color}`}>{author}</span>
                    <span className="text-[10px] text-slate-500">
                      {formatMessageTime(reply.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed break-words select-text">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {reply.body}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={repliesEndRef} />
      </div>

      {/* Thread Composer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2 shadow-inner focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply in thread..."
            rows={2}
            className="w-full resize-none bg-transparent px-2 text-xs text-slate-100 placeholder-slate-500 outline-none max-h-32 scrollbar-thin select-text"
          />
          <div className="flex items-center justify-between pt-1.5 px-1 border-t border-slate-800/60">
            <span className="text-[10px] text-slate-500">Enter to reply</span>
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 transition-all shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
