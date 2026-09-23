import { z } from 'zod';
import { APP_CONSTANTS } from '../constants.js';

export const createConversationSchema = z.object({
  type: z.enum(['CHANNEL', 'DM', 'GROUP']),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(APP_CONSTANTS.CONVERSATION_NAME_MAX_LENGTH, 'Name is too long')
    .optional()
    .nullable(),
  topic: z
    .string()
    .max(APP_CONSTANTS.CONVERSATION_TOPIC_MAX_LENGTH, 'Topic is too long')
    .optional()
    .nullable(),
  isPrivate: z.boolean().default(false),
  memberUserIds: z.array(z.string()).default([]),
});

export const updateConversationSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(APP_CONSTANTS.CONVERSATION_NAME_MAX_LENGTH)
    .optional()
    .nullable(),
  topic: z
    .string()
    .max(APP_CONSTANTS.CONVERSATION_TOPIC_MAX_LENGTH)
    .optional()
    .nullable(),
  archived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  mutedUntil: z.string().datetime().optional().nullable(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
