import { z } from 'zod';
import { APP_CONSTANTS } from '../constants.js';

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  clientMessageId: z.string().uuid('clientMessageId must be a valid UUID'),
  body: z
    .string()
    .min(1, 'Message body cannot be empty')
    .max(APP_CONSTANTS.MESSAGE_MAX_LENGTH, 'Message exceeds 4,000 character limit')
    .trim(),
  replyToId: z.string().optional().nullable(),
  attachmentIds: z.array(z.string()).optional(),
  metadata: z.string().optional().nullable(),
});

export const editMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  body: z
    .string()
    .min(1, 'Message body cannot be empty')
    .max(APP_CONSTANTS.MESSAGE_MAX_LENGTH, 'Message exceeds 4,000 character limit')
    .trim(),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
});

export const toggleReactionSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  emoji: z
    .string()
    .min(1, 'Emoji is required')
    .max(8, 'Emoji is too long'),
});

export const messagePaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(APP_CONSTANTS.MAX_PAGE_SIZE).default(APP_CONSTANTS.DEFAULT_PAGE_SIZE),
  direction: z.enum(['older', 'newer']).default('older'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
export type MessagePaginationInput = z.infer<typeof messagePaginationSchema>;
