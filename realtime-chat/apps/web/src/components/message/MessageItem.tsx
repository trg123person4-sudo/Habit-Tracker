import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { MessageDto } from '@realtime-chat/shared';
import { Avatar } from '../common/Avatar.js';
import { getUserColor, formatMessageTime, formatBytes, cn } from '../../lib/utils.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { useChatStore } from '../../stores/chat-store.js';
import { getSocket } from '../../lib/socket-client.js';
import { api } from '../../lib/api-client.js';
import { soundService } from '../../lib/sound-service.js';
import { PollCard } from './PollCard.js';
import { AudioPlayer } from './AudioPlayer.js';
import {
  Clock,
  AlertCircle,
  RefreshCw,
  Reply,
  Pencil,
  Trash2,
  FileText,
  Download,
  MessageSquare,
  Pin,
  Bookmark,
  Languages,
  Check,
  Copy,
  Loader2,
} from 'lucide-react';

interface MessageItemProps {
  message: MessageDto;
  isGrouped: boolean;
  onRetry?: (message: MessageDto) => void;
  onReactionToggle?: (messageId: string, emoji: string) => void;
}

// Code block with copy-to-clipboard button
function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">
          {className?.replace('language-', '') || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-slate-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function MessageItem({ message, isGrouped, onRetry, onReactionToggle }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);

  // Translation State
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const { user } = useAuthStore();
  const {
    setReplyingTo,
    updateMessage,
    removeMessage,
    openThread,
    toggleMessageSave,
  } = useChatStore();

  const isDeleted = !!message.deletedAt;
  const isPending = message.status === 'pending';
  const isFailed = message.status === 'failed';
  const isAuthor = user?.id === message.senderId;
  const isPinned = !!message.pinnedAt;
  const isSaved = !!message.isSaved;

  const senderName = message.sender?.displayName || message.sender?.username || 'Unknown';
  const nameColor = getUserColor(message.sender?.username || '');

  const handleReaction = (emoji: string) => {
    if (onReactionToggle) {
      onReactionToggle(message.id, emoji);
    } else {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('reaction:toggle', { messageId: message.id, emoji });
      }
    }
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.body) {
      setIsEditing(false);
      return;
    }

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('message:edit', { messageId: message.id, body: trimmed }, (res) => {
        if (res.ok && res.data) {
          updateMessage(res.data);
        }
      });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('message:delete', { messageId: message.id }, (res) => {
          if (res.ok) {
            removeMessage(message.conversationId, message.id);
          }
        });
      }
    }
  };

  const handlePin = () => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('message:pin', { messageId: message.id, pinned: !isPinned });
    }
  };

  const handleSave = () => {
    const nextSaved = !isSaved;
    toggleMessageSave(message.id, nextSaved);
    soundService.playReaction();
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('message:save', { messageId: message.id, saved: nextSaved });
    }
  };

  const handleTranslate = async () => {
    if (translatedText) {
      // Toggle off
      setTranslatedText(null);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await api.post<{ translatedText: string; detectedLanguage: string }>(
        '/ai/translate',
        {
          text: message.body,
          targetLanguage: 'en',
        },
      );
      setTranslatedText(res.translatedText);
      setDetectedLanguage(res.detectedLanguage);
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Parse message metadata
  let parsedMetadata: any = null;
  if (message.metadata) {
    try {
      parsedMetadata =
        typeof message.metadata === 'string' ? JSON.parse(message.metadata) : message.metadata;
    } catch {}
  }

  // Check if message has voice audio
  const audioAttachment = message.attachments?.find(
    (a) =>
      a.mimeType.startsWith('audio/') ||
      a.fileName.endsWith('.webm') ||
      a.fileName.endsWith('.mp3'),
  );

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 py-1 hover:bg-slate-900/40 transition-colors',
        isGrouped ? 'mt-0 pt-0.5' : 'mt-2 pt-1.5',
        isPending && 'opacity-60',
        isFailed && 'bg-rose-950/20 border-l-2 border-rose-500',
        isPinned && 'bg-amber-950/10 border-l-2 border-amber-500/60',
      )}
    >
      {/* Pinned Indicator Header */}
      {isPinned && !isGrouped && (
        <div className="absolute -top-3 left-14 flex items-center gap-1 text-[10px] font-semibold text-amber-400 select-none">
          <Pin className="w-2.5 h-2.5 fill-amber-400" />
          <span>Pinned</span>
        </div>
      )}

      {/* Hover Action Bar */}
      {!isDeleted && !isPending && !isFailed && !isEditing && (
        <div className="absolute -top-3.5 right-4 hidden group-hover:flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-xl px-1.5 py-0.5 z-10 select-none">
          {/* Quick Reaction Emojis */}
          {['👍', '❤️', '😂', '🎉', '🚀'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              title={`React with ${emoji}`}
              className="px-1 py-0.5 text-xs hover:scale-125 transition-transform rounded hover:bg-slate-800"
            >
              {emoji}
            </button>
          ))}

          <div className="w-px h-3.5 bg-slate-700 mx-1" />

          {/* Reply in dedicated thread drawer */}
          <button
            onClick={() => openThread(message)}
            title="Reply in thread"
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Quote Reply in Composer */}
          <button
            onClick={() => setReplyingTo(message)}
            title="Quote Reply"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* Pin Message Toggle */}
          <button
            onClick={handlePin}
            title={isPinned ? 'Unpin message' : 'Pin message'}
            className={cn(
              'p-1 rounded transition-colors',
              isPinned
                ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/60'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800',
            )}
          >
            <Pin className={cn('w-3.5 h-3.5', isPinned && 'fill-amber-400')} />
          </button>

          {/* Bookmark / Saved */}
          <button
            onClick={handleSave}
            title={isSaved ? 'Remove bookmark' : 'Bookmark message'}
            className={cn(
              'p-1 rounded transition-colors',
              isSaved
                ? 'text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/60'
                : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800',
            )}
          >
            <Bookmark className={cn('w-3.5 h-3.5', isSaved && 'fill-indigo-400')} />
          </button>

          {/* Real-time Translate */}
          <button
            onClick={handleTranslate}
            title="Translate message"
            className={cn(
              'p-1 rounded transition-colors',
              translatedText
                ? 'text-indigo-400 bg-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800',
            )}
          >
            {isTranslating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Languages className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Edit & Delete for author */}
          {isAuthor && (
            <>
              <div className="w-px h-3.5 bg-slate-700 mx-1" />
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditText(message.body);
                }}
                title="Edit Message"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                title="Delete Message"
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Left Column: Avatar or Grouped Spacer */}
      <div className="w-8 shrink-0 flex justify-center">
        {!isGrouped ? (
          <Avatar name={senderName} src={message.sender?.avatarUrl} size="md" />
        ) : (
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 select-none self-center">
            {formatMessageTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Right Column: Message Content */}
      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5 select-none">
            <span className={cn('text-xs font-semibold tracking-tight', nameColor)}>
              {senderName}
            </span>
            <span className="text-[10px] text-slate-500">
              {formatMessageTime(message.createdAt)}
            </span>
            {message.editedAt && !isDeleted && (
              <span className="text-[10px] text-slate-500 italic">(edited)</span>
            )}
            {isSaved && (
              <span title="Bookmarked">
                <Bookmark className="w-3 h-3 text-indigo-400 fill-indigo-400" />
              </span>
            )}
          </div>
        )}

        {/* Quoted Parent Reply (if reply) */}
        {message.replyTo && (
          <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border-l-2 border-indigo-500 max-w-lg truncate">
            <span className="font-semibold text-slate-300">
              @{message.replyTo.sender?.displayName || message.replyTo.sender?.username}:
            </span>
            <span className="truncate text-slate-400">{message.replyTo.body}</span>
          </div>
        )}

        {/* Message Body or Inline Edit Mode */}
        {isDeleted ? (
          <p className="text-xs text-slate-500 italic">This message was deleted</p>
        ) : isEditing ? (
          <div className="mt-1 space-y-1.5 max-w-2xl">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                }
              }}
              rows={2}
              className="w-full rounded-lg border border-indigo-500/80 bg-slate-950 p-2 text-sm text-slate-100 outline-none select-text"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500">
                Enter to save • Shift+Enter for newline • Esc to cancel
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-200 leading-relaxed break-words select-text">
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');
                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 text-xs font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
              }}
            >
              {message.body}
            </ReactMarkdown>

            {/* Translated Preview Accordion */}
            {translatedText && (
              <div className="mt-2 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-100 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold mb-1">
                  <div className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" />
                    <span>Translated from {detectedLanguage || 'auto'} to English:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTranslatedText(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>
                <p className="text-slate-200 leading-relaxed">{translatedText}</p>
              </div>
            )}
          </div>
        )}

        {/* Interactive Poll Rendering */}
        {parsedMetadata?.poll && !isDeleted && (
          <PollCard messageId={message.id} poll={parsedMetadata.poll} />
        )}

        {/* Voice Audio Message Player */}
        {audioAttachment && !isDeleted && (
          <AudioPlayer
            url={audioAttachment.url || `/api/v1/uploads/${audioAttachment.id}`}
            durationSeconds={parsedMetadata?.durationSeconds || 5}
          />
        )}

        {/* Non-Audio Attachments */}
        {message.attachments &&
          message.attachments.length > 0 &&
          !isDeleted &&
          !audioAttachment && (
            <div className="mt-2 space-y-2">
              {/* Image Attachments */}
              {(() => {
                const imageAttachments = message.attachments.filter((a) =>
                  a.mimeType.startsWith('image/'),
                );
                if (imageAttachments.length === 0) return null;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
                    {imageAttachments.map((att) => {
                      const fileUrl = att.url || `/api/v1/uploads/${att.id}`;
                      return (
                        <div
                          key={att.id}
                          className="group/img relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-md"
                        >
                          <img
                            src={fileUrl}
                            alt={att.fileName}
                            loading="lazy"
                            onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                            className="max-h-64 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-[11px] text-slate-200 opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <span className="truncate mr-2">{att.fileName}</span>
                            <span className="text-slate-400 shrink-0">
                              {formatBytes(att.fileSize)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Non-Image / Non-Audio File Attachments */}
              {(() => {
                const fileAttachments = message.attachments.filter(
                  (a) => !a.mimeType.startsWith('image/') && !a.mimeType.startsWith('audio/'),
                );
                if (fileAttachments.length === 0) return null;
                return (
                  <div className="flex flex-col gap-1.5 max-w-md">
                    {fileAttachments.map((att) => {
                      const fileUrl = att.url || `/api/v1/uploads/${att.id}`;
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all group/file"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-medium text-slate-200 truncate group-hover/file:text-white">
                                {att.fileName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatBytes(att.fileSize)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <a
                              href={fileUrl}
                              download={att.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download attachment"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        {/* Dedicated Thread Replies Indicator Button */}
        {message.replyCount && message.replyCount > 0 && !isDeleted && (
          <button
            type="button"
            onClick={() => openThread(message)}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all group/thread select-none shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400 group-hover/thread:scale-110 transition-transform" />
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            {message.lastReplyAt && (
              <span className="text-[10px] text-slate-400 font-normal">
                • Last reply {formatMessageTime(message.lastReplyAt)}
              </span>
            )}
          </button>
        )}

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && !isEditing && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((r) => {
              const hasReacted = user ? r.userIds.includes(user.id) : false;
              return (
                <button
                  key={r.emoji}
                  onClick={() => handleReaction(r.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all select-none',
                    hasReacted
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-semibold'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-indigo-500 hover:text-white',
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px] font-semibold">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Optimistic Status Indicators */}
        {isPending && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 select-none">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Sending...</span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2 mt-1 text-xs text-rose-400 select-none">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Failed to send</span>
            </div>
            {onRetry && (
              <button
                onClick={() => onRetry(message)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
