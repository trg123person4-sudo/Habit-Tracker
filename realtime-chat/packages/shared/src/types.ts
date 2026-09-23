export type PresenceStatus = 'online' | 'away' | 'offline';

export type ConversationType = 'CHANNEL' | 'DM' | 'GROUP';

export type MembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface UserSummaryDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  presence?: PresenceStatus;
}

export interface UserDto extends UserSummaryDto {
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDto extends UserDto {
  // Can be extended with preferences
}

export interface MembershipDto {
  id: string;
  conversationId: string;
  userId: string;
  role: MembershipRole;
  lastReadMessageId: string | null;
  mutedUntil: string | null;
  createdAt: string;
  user?: UserSummaryDto;
}

export interface AttachmentDto {
  id: string;
  messageId: string | null;
  conversationId: string | null;
  uploaderId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  thumbnailKey: string | null;
  url: string;
  createdAt: string;
}

export interface ReactionDto {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean;
}

export interface MessageDto {
  id: string; // Sortable ULID
  conversationId: string;
  senderId: string;
  sender: UserSummaryDto;
  body: string;
  replyToId: string | null;
  replyTo?: {
    id: string;
    sender: UserSummaryDto;
    body: string;
  } | null;
  clientMessageId: string;
  editedAt: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  attachments: AttachmentDto[];
  reactions: ReactionDto[];
  replyCount?: number;
  lastReplyAt?: string | null;
  pinnedAt?: string | null;
  pinnedById?: string | null;
  metadata?: string | null;
  isSaved?: boolean;
  status?: 'pending' | 'sent' | 'failed';
}

export interface PollOptionDto {
  index: number;
  text: string;
  votes: number;
  voterIds: string[];
  userVoted: boolean;
}

export interface PollDto {
  question: string;
  options: PollOptionDto[];
  totalVotes: number;
}

export interface ToneCheckResultDto {
  score: number; // 0 (gentle) to 100 (harsh)
  label: 'gentle' | 'neutral' | 'harsh';
  warnings: string[];
  suggestion?: string;
}

export interface CatchUpSummaryDto {
  summary: string;
  bulletPoints: string[];
  actionItems: string[];
  messageCount: number;
  channelName: string;
}

export interface SmartRepliesDto {
  replies: string[];
}

export interface TranslationResultDto {
  originalText: string;
  translatedText: string;
  targetLanguage: string;
  detectedLanguage?: string;
}

export interface SavedMessageDto {
  id: string;
  userId: string;
  messageId: string;
  message: MessageDto;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  type: ConversationType;
  name: string | null;
  topic: string | null;
  isPrivate: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  members?: MembershipDto[];
  lastMessage?: MessageDto | null;
  unreadCount?: number;
  isMuted?: boolean;
}

export interface SearchResultDto {
  message: MessageDto;
  highlight: string;
  conversation: {
    id: string;
    name: string | null;
    type: ConversationType;
  };
}

export interface SyncResultDto {
  messages: Record<string, MessageDto[]>;
  readStates: Record<string, string>;
}

export type SocketResponse<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
