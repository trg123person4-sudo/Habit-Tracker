import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Paperclip,
  X,
  CornerDownRight,
  FileText,
  Loader2,
  Mic,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  BarChart2,
  PartyPopper,
  Code,
} from 'lucide-react';
import { useChatStore } from '../../stores/chat-store.js';
import { useAuthStore } from '../../stores/auth-store.js';
import { getSocket } from '../../lib/socket-client.js';
import { api } from '../../lib/api-client.js';
import { soundService } from '../../lib/sound-service.js';
import { VoiceRecorder } from './VoiceRecorder.js';
import { APP_CONSTANTS, MessageDto, AttachmentDto, SmartRepliesDto } from '@realtime-chat/shared';

interface ComposerProps {
  conversationId: string;
}

const SLASH_COMMANDS = [
  {
    command: '/poll',
    description: 'Create an interactive poll: /poll "Question" "Option 1" "Option 2"',
    template: '/poll "What should we prioritize?" "Feature A" "Feature B" "Bugfixes"',
    icon: BarChart2,
  },
  {
    command: '/catchup',
    description: 'Summarize missed messages in this channel',
    template: '/catchup',
    icon: Sparkles,
  },
  {
    command: '/celebrate',
    description: 'Trigger celebration confetti and sound effects',
    template: 'We shipped it! 🎉🚀',
    icon: PartyPopper,
  },
  {
    command: '/code',
    description: 'Insert a formatted code snippet block',
    template: '```typescript\n// Write your code here\nconsole.log("Hello, PulseChat!");\n```',
    icon: Code,
  },
  {
    command: '/shrug',
    description: 'Append classic shrug emoticon ¯\\_(ツ)_/¯',
    template: '¯\\_(ツ)_/¯',
    icon: Smile,
  },
  {
    command: '/tableflip',
    description: 'Append table flip emoticon (╯°□°)╯︵ ┻━┻',
    template: '(╯°□°)╯︵ ┻━┻',
    icon: Smile,
  },
];

export function Composer({ conversationId }: ComposerProps) {
  const [text, setText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentDto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Next-Gen States
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [toneWarning, setToneWarning] = useState<{
    warning: string;
    suggestion?: string;
  } | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneCheckDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const { user } = useAuthStore();
  const {
    addMessage,
    updateMessageStatus,
    replyingTo,
    setReplyingTo,
    typingUsers,
    messages,
    setCatchUpOpen,
    enqueueOutbox,
    triggerConfetti,
  } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Clean up typing when conversation changes or unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('typing:stop', { conversationId });
      }
    };
  }, [conversationId]);

  // Fetch contextual Smart Replies when last message in conversation updates
  useEffect(() => {
    const convMsgs = messages[conversationId] || [];
    if (convMsgs.length === 0) {
      setSmartReplies([]);
      return;
    }

    const lastMsg = convMsgs[convMsgs.length - 1];
    // Only suggest replies if the last message is from someone else
    if (user && lastMsg.senderId === user.id) {
      setSmartReplies([]);
      return;
    }

    let isMounted = true;
    api
      .get<SmartRepliesDto>(`/ai/smart-replies/${conversationId}`)
      .then((res) => {
        if (isMounted && res && res.replies) {
          setSmartReplies(res.replies);
        }
      })
      .catch(() => {
        // Fallback default quick replies
        if (isMounted) {
          setSmartReplies(['Sounds good! 👍', 'On it right now.', 'Thanks for the update!']);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [conversationId, messages[conversationId]?.length, user?.id]);

  // Check Tone when typing
  const evaluateTone = (content: string) => {
    if (!content || content.length < 12) {
      setToneWarning(null);
      return;
    }

    const lower = content.toLowerCase();
    const harshWords = [
      'stupid',
      'idiot',
      'ridiculous',
      'incompetent',
      'pathetic',
      'shut up',
      'hate this',
      'you never',
      'waste of time',
      'nonsense',
      'garbage',
      'horrible work',
    ];

    const foundHarsh = harshWords.find((w) => lower.includes(w));
    const uppercaseWords = content.match(/\b[A-Z]{3,}\b/g) || [];

    if (foundHarsh) {
      setToneWarning({
        warning: `This message includes "${foundHarsh}", which may read as harsh or confrontational.`,
        suggestion: content
          .replace(/stupid|idiot|garbage|incompetent/gi, 'challenging')
          .replace(/waste of time/gi, 'could be more efficient')
          .replace(/hate this/gi, 'would prefer another approach'),
      });
    } else if (uppercaseWords.length >= 3) {
      setToneWarning({
        warning: 'Heavy ALL-CAPS text may be perceived as shouting.',
        suggestion: content.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      });
    } else {
      setToneWarning(null);
    }
  };

  const emitTyping = (isTyping: boolean) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (isTyping) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > 2000) {
        lastTypingSentRef.current = now;
        socket.emit('typing:start', { conversationId });
      }
    } else {
      lastTypingSentRef.current = 0;
      socket.emit('typing:stop', { conversationId });
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Slash command trigger
    if (val.startsWith('/') && !val.includes(' ') && val.length > 0) {
      setShowSlashMenu(true);
    } else {
      setShowSlashMenu(false);
    }

    // Tone Check debounce
    if (toneCheckDebounceRef.current) clearTimeout(toneCheckDebounceRef.current);
    toneCheckDebounceRef.current = setTimeout(() => {
      evaluateTone(val);
    }, 400);

    if (val.trim()) {
      emitTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(false);
      }, 3000);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTyping(false);
    }
  };

  const handleBlur = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds limit of 25MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    try {
      const res = await api.post<{ attachment: AttachmentDto }>('/uploads', formData);
      setPendingAttachments((prev) => [...prev, res.attachment]);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Voice message handler
  const handleVoiceRecorded = async (audioBlob: Blob, durationSeconds: number) => {
    if (!user) return;
    setIsRecordingVoice(false);
    setIsUploading(true);

    const formData = new FormData();
    const voiceFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
      type: audioBlob.type || 'audio/webm',
    });
    formData.append('file', voiceFile);
    formData.append('conversationId', conversationId);

    try {
      const uploadRes = await api.post<{ attachment: AttachmentDto }>('/uploads', formData);
      const att = uploadRes.attachment;

      // Construct and send voice message
      const clientMessageId = crypto.randomUUID();
      const body = `🎙️ Voice message (${durationSeconds}s)`;
      const metadata = JSON.stringify({
        voice: true,
        durationSeconds,
      });

      const optimisticMessage: MessageDto = {
        id: `optimistic_${clientMessageId}`,
        conversationId,
        senderId: user.id,
        sender: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          statusMessage: user.statusMessage,
        },
        body,
        replyToId: null,
        replyTo: null,
        clientMessageId,
        editedAt: null,
        deletedAt: null,
        deletedBy: null,
        createdAt: new Date().toISOString(),
        attachments: [att],
        reactions: [],
        metadata,
        status: 'pending',
      };

      addMessage(optimisticMessage);
      soundService.playSend();

      const socket = getSocket();
      if (!socket || !socket.connected) {
        enqueueOutbox({
          conversationId,
          clientMessageId,
          body,
          attachmentIds: [att.id],
          metadata,
        });
        return;
      }

      socket.emit(
        'message:send',
        {
          conversationId,
          clientMessageId,
          body,
          attachmentIds: [att.id],
          metadata,
        },
        (res) => {
          if (res.ok && res.data) {
            updateMessageStatus(conversationId, clientMessageId, 'sent', res.data);
          } else {
            updateMessageStatus(conversationId, clientMessageId, 'failed');
          }
        },
      );
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload voice message');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    let trimmed = text.trim();
    if ((!trimmed && pendingAttachments.length === 0) || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
    setToneWarning(null);
    setShowSlashMenu(false);

    // 1. Slash command intercepts
    if (trimmed === '/catchup') {
      setText('');
      setCatchUpOpen(true);
      return;
    }

    let messageMetadata: any = undefined;

    // Check for interactive poll command: /poll "Question" "Option 1" "Option 2"
    if (trimmed.startsWith('/poll ')) {
      const pollRaw = trimmed.slice(6).trim();
      let question = '';
      let optionTexts: string[] = [];

      if (pollRaw.includes('|')) {
        const parts = pollRaw.split('|').map((s) => s.trim()).filter(Boolean);
        if (parts.length >= 3) {
          question = parts[0];
          optionTexts = parts.slice(1);
        }
      } else {
        const matches = Array.from(pollRaw.matchAll(/"([^"]+)"/g)).map((m) => m[1]);
        if (matches.length >= 3) {
          question = matches[0];
          optionTexts = matches.slice(1);
        }
      }

      if (question && optionTexts.length >= 2) {
        messageMetadata = {
          poll: {
            question,
            options: optionTexts.map((optText, idx) => ({
              index: idx,
              text: optText,
              votes: 0,
              voterIds: [],
              userVoted: false,
            })),
            totalVotes: 0,
          },
        };
        trimmed = `📊 Poll: ${question}`;
      }
    }

    // Check celebration cues
    const isCelebration =
      trimmed.toLowerCase().includes('we shipped it') ||
      trimmed.toLowerCase().includes('congrats') ||
      trimmed.startsWith('/celebrate') ||
      trimmed.startsWith('/confetti');

    if (isCelebration) {
      if (trimmed.startsWith('/celebrate') || trimmed.startsWith('/confetti')) {
        trimmed = 'We shipped it! 🎉🚀';
      }
      messageMetadata = { ...(messageMetadata || {}), effect: 'confetti' };
      triggerConfetti();
      soundService.playCelebration();
    } else {
      soundService.playSend();
    }

    const clientMessageId = crypto.randomUUID();
    const tempId = `optimistic_${clientMessageId}`;
    const currentReply = replyingTo;
    const currentAttachments = [...pendingAttachments];
    const attachmentIds = currentAttachments.map((a) => a.id);

    const serializedMetadata = messageMetadata ? JSON.stringify(messageMetadata) : undefined;

    // Optimistic Message
    const optimisticMessage: MessageDto = {
      id: tempId,
      conversationId,
      senderId: user.id,
      sender: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
      },
      body: trimmed,
      replyToId: currentReply ? currentReply.id : null,
      replyTo: currentReply
        ? {
            id: currentReply.id,
            sender: currentReply.sender,
            body: currentReply.body,
          }
        : null,
      clientMessageId,
      editedAt: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date().toISOString(),
      attachments: currentAttachments,
      reactions: [],
      metadata: serializedMetadata,
      status: 'pending',
    };

    addMessage(optimisticMessage);
    setText('');
    setReplyingTo(null);
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Real-Time Socket Emit or Offline Outbox Queuing
    const socket = getSocket();
    if (!socket || !socket.connected) {
      enqueueOutbox({
        conversationId,
        clientMessageId,
        body: trimmed,
        ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
        ...(currentReply ? { replyToId: currentReply.id } : {}),
        ...(serializedMetadata ? { metadata: serializedMetadata } : {}),
      });
      return;
    }

    let ackReceived = false;
    const timeout = setTimeout(() => {
      if (!ackReceived) {
        updateMessageStatus(conversationId, clientMessageId, 'failed');
      }
    }, 8000);

    socket.emit(
      'message:send',
      {
        conversationId,
        clientMessageId,
        body: trimmed,
        ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
        ...(currentReply ? { replyToId: currentReply.id } : {}),
        ...(serializedMetadata ? { metadata: serializedMetadata } : {}),
      },
      (res) => {
        ackReceived = true;
        clearTimeout(timeout);
        if (res.ok && res.data) {
          updateMessageStatus(conversationId, clientMessageId, 'sent', res.data);
        } else {
          updateMessageStatus(conversationId, clientMessageId, 'failed');
        }
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOverLimit = text.length > APP_CONSTANTS.MESSAGE_MAX_LENGTH;

  // Active typing indicator users
  const activeTypers = (typingUsers[conversationId] || []).filter(
    (u) => u.userId !== user?.id,
  );

  let typingText = '';
  if (activeTypers.length === 1) {
    typingText = `${activeTypers[0].username} is typing...`;
  } else if (activeTypers.length === 2) {
    typingText = `${activeTypers[0].username} and ${activeTypers[1].username} are typing...`;
  } else if (activeTypers.length > 2) {
    typingText = 'Several people are typing...';
  }

  return (
    <div className="p-4 bg-slate-900/60 border-t border-slate-800 relative select-none">
      {/* Live Typing Indicator */}
      <div className="h-5 px-1 mb-1">
        {typingText && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 italic animate-fade-in">
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
            <span>{typingText}</span>
          </div>
        )}
      </div>

      {/* Contextual Smart Reply Chips */}
      {smartReplies.length > 0 && !text && !isRecordingVoice && (
        <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none animate-in fade-in">
          <span className="text-[10px] uppercase font-bold text-indigo-400/80 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Suggested:
          </span>
          {smartReplies.map((replyText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setText(replyText);
                textareaRef.current?.focus();
              }}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/80 text-slate-300 transition-all shadow-sm active:scale-95 shrink-0"
            >
              {replyText}
            </button>
          ))}
        </div>
      )}

      {/* Slash Commands Dropdown Menu */}
      {showSlashMenu && (
        <div className="absolute bottom-full left-4 mb-2 w-80 rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl p-2 z-30 backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
            Slash Commands
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {SLASH_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => {
                    setText(cmd.template);
                    setShowSlashMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-indigo-600/20 hover:border-indigo-500/30 border border-transparent transition-all group"
                >
                  <div className="p-1 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-200">
                      {cmd.command}
                    </span>
                    <p className="text-[10px] text-slate-400 truncate">{cmd.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gentle Pre-Send Tone Check Warning Banner */}
      {toneWarning && (
        <div className="mb-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start justify-between gap-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Tone Check: </span>
              <span>{toneWarning.warning}</span>
              {toneWarning.suggestion && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-300">Suggestion:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (toneWarning.suggestion) {
                        setText(toneWarning.suggestion);
                        setToneWarning(null);
                      }
                    }}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline"
                  >
                    "{toneWarning.suggestion}"
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToneWarning(null)}
            className="p-0.5 text-amber-400 hover:text-white rounded"
            title="Dismiss tone check"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="mb-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-0.5 text-rose-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quote Reply Preview Bar */}
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between bg-slate-950/90 border border-slate-800 border-l-4 border-l-indigo-500 px-3 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 truncate text-slate-300">
            <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-semibold text-white">
              Replying to @{replyingTo.sender?.displayName || replyingTo.sender?.username}:
            </span>
            <span className="truncate text-slate-400">{replyingTo.body}</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 ml-2 shrink-0"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Attachments List */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="max-w-xs truncate font-medium">{att.fileName}</span>
              <span className="text-[10px] text-slate-500">
                ({Math.round(att.fileSize / 1024)} KB)
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 ml-1"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Recorder Overlay or Main Composer Box */}
      {isRecordingVoice ? (
        <VoiceRecorder
          onRecorded={handleVoiceRecorded}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-2.5 shadow-lg focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or '/' for commands (/poll, /catchup)..."
            rows={1}
            maxLength={APP_CONSTANTS.MESSAGE_MAX_LENGTH + 50}
            className="w-full resize-none bg-transparent px-2 text-sm text-slate-100 placeholder-slate-500 outline-none max-h-44 scrollbar-thin select-text"
          />

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

          <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-900/80">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title="Add attachment (max 25MB)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              {/* Native Voice Message Recorder Trigger */}
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                title="Record voice message"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setText((prev) => (prev ? `${prev} 😊` : '😊'));
                  textareaRef.current?.focus();
                }}
                title="Add emoji"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowSlashMenu(!showSlashMenu)}
                title="Slash commands (/poll, /catchup)"
                className={`p-1.5 rounded-lg transition-colors ${
                  showSlashMenu
                    ? 'text-indigo-400 bg-indigo-950/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] ${
                  isOverLimit
                    ? 'text-rose-400 font-bold'
                    : text.length > 3500
                      ? 'text-amber-400'
                      : 'text-slate-500'
                }`}
              >
                {text.length} / {APP_CONSTANTS.MESSAGE_MAX_LENGTH}
              </span>

              <button
                type="button"
                onClick={handleSend}
                disabled={
                  (!text.trim() && pendingAttachments.length === 0) || isOverLimit || isUploading
                }
                className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 transition-all shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
