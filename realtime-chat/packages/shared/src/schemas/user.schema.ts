import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  statusMessage: z.string().max(100).optional().nullable(),
});

export const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
