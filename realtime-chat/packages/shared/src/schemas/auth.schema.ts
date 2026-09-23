import { z } from 'zod';
import { APP_CONSTANTS } from '../constants.js';

export const registerSchema = z.object({
  username: z
    .string()
    .min(APP_CONSTANTS.USERNAME_MIN_LENGTH, 'Username must be at least 3 characters')
    .max(APP_CONSTANTS.USERNAME_MAX_LENGTH, 'Username cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and dashes')
    .transform((val) => val.toLowerCase()),
  email: z.string().email('Invalid email address').transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(APP_CONSTANTS.PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters')
    .max(APP_CONSTANTS.PASSWORD_MAX_LENGTH, 'Password cannot exceed 128 characters'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name cannot exceed 50 characters'),
});

export const loginSchema = z
  .object({
    login: z.string().optional(),
    username: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => data.login || data.username, {
    message: 'Username or email is required',
    path: ['login'],
  })
  .transform((data) => ({
    login: ((data.login || data.username) as string).toLowerCase(),
    password: data.password,
  }));

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
