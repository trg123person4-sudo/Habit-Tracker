import { v4 as uuidv4 } from 'uuid';
import { RegisterInput, LoginInput, UserDto } from '@realtime-chat/shared';
import { prisma } from '../db/client.js';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  generateSecureToken,
  hashToken,
} from '../utils/crypto.js';
import { generateId } from '../utils/ulid.js';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';

export interface AuthResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private formatUserDto(user: {
    id: string;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    statusMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      statusMessage: user.statusMessage,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: input.username } },
          { email: { equals: input.email } },
        ],
      },
    });

    if (existing) {
      if (existing.username.toLowerCase() === input.username.toLowerCase()) {
        throw AppError.conflict('Username is already taken');
      }
      throw AppError.conflict('Email is already registered');
    }

    const passwordHash = await hashPassword(input.password);
    const userId = generateId();

    const rawRefreshToken = generateSecureToken();
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = uuidv4();
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    const user = await prisma.user.create({
      data: {
        id: userId,
        username: input.username,
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        refreshTokens: {
          create: {
            tokenHash,
            familyId,
            expiresAt,
          },
        },
      },
    });

    const accessToken = await signAccessToken({
      userId: user.id,
      username: user.username,
    });

    return {
      user: this.formatUserDto(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: input.login } },
          { email: { equals: input.login } },
        ],
      },
    });

    if (!user) {
      const allUsers = await prisma.user.findMany();
      user =
        allUsers.find(
          (u) =>
            u.username.toLowerCase() === input.login.toLowerCase() ||
            u.email.toLowerCase() === input.login.toLowerCase(),
        ) || null;
    }

    if (!user) {
      throw AppError.unauthorized('Invalid username/email or password');
    }

    const isValidPassword = await verifyPassword(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw AppError.unauthorized('Invalid username/email or password');
    }

    const rawRefreshToken = generateSecureToken();
    const tokenHash = hashToken(rawRefreshToken);
    const familyId = uuidv4();
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: user.id,
        familyId,
        expiresAt,
      },
    });

    const accessToken = await signAccessToken({
      userId: user.id,
      username: user.username,
    });

    return {
      user: this.formatUserDto(user),
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthResult> {
    if (!rawRefreshToken) {
      throw AppError.unauthorized('Refresh token is required');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Reuse detection: If an already revoked token is used, invalidate the entire family!
    if (storedToken.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
      throw AppError.unauthorized('Token reuse detected. All sessions in this family revoked.');
    }

    // Check expiration
    if (storedToken.expiresAt < new Date()) {
      throw AppError.unauthorized('Refresh token expired');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new token in same family
    const newRawRefreshToken = generateSecureToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        familyId: storedToken.familyId,
        expiresAt,
      },
    });

    const accessToken = await signAccessToken({
      userId: storedToken.user.id,
      username: storedToken.user.username,
    });

    return {
      user: this.formatUserDto(storedToken.user),
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash },
    });

    if (storedToken) {
      await prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });
    }
  }

  async getUserById(userId: string): Promise<UserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    return this.formatUserDto(user);
  }
}

export const authService = new AuthService();
