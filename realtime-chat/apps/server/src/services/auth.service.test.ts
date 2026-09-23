import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { prisma } from '../db/client.js';
import { hashToken } from '../utils/crypto.js';

describe('AuthService (Argon2id, JWT, Token Family Rotation)', () => {
  let authService: AuthService;

  // In-memory mock tables for testing
  let users: any[] = [];
  let refreshTokens: any[] = [];

  beforeEach(() => {
    authService = new AuthService();
    users = [];
    refreshTokens = [];

    // Mock prisma.user methods
    vi.spyOn(prisma.user, 'findFirst').mockImplementation(async ({ where }: any) => {
      if (where.OR) {
        return users.find((u) =>
          where.OR.some(
            (cond: any) =>
              (cond.username && u.username.toLowerCase() === cond.username.equals.toLowerCase()) ||
              (cond.email && u.email.toLowerCase() === cond.email.equals.toLowerCase()),
          ),
        ) ?? null;
      }
      return null;
    });

    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async ({ where }: any) => {
      return users.find((u) => u.id === where.id) ?? null;
    });

    vi.spyOn(prisma.user, 'create').mockImplementation(async ({ data }: any) => {
      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        avatarUrl: null,
        statusMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.push(user);

      if (data.refreshTokens?.create) {
        const rt = {
          id: 'rt_' + Math.random().toString(36).substring(7),
          tokenHash: data.refreshTokens.create.tokenHash,
          userId: user.id,
          familyId: data.refreshTokens.create.familyId,
          isRevoked: false,
          expiresAt: data.refreshTokens.create.expiresAt,
          createdAt: new Date(),
          user,
        };
        refreshTokens.push(rt);
      }

      return user;
    });

    // Mock prisma.refreshToken methods
    vi.spyOn(prisma.refreshToken, 'create').mockImplementation(async ({ data }: any) => {
      const user = users.find((u) => u.id === data.userId);
      const rt = {
        id: 'rt_' + Math.random().toString(36).substring(7),
        tokenHash: data.tokenHash,
        userId: data.userId,
        familyId: data.familyId,
        isRevoked: false,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        user,
      };
      refreshTokens.push(rt);
      return rt;
    });

    vi.spyOn(prisma.refreshToken, 'findFirst').mockImplementation(async ({ where }: any) => {
      return refreshTokens.find((r) => r.tokenHash === where.tokenHash) ?? null;
    });

    vi.spyOn(prisma.refreshToken, 'update').mockImplementation(async ({ where, data }: any) => {
      const token = refreshTokens.find((r) => r.id === where.id);
      if (token) {
        Object.assign(token, data);
        return token;
      }
      throw new Error('Not found');
    });

    vi.spyOn(prisma.refreshToken, 'updateMany').mockImplementation(async ({ where, data }: any) => {
      let count = 0;
      refreshTokens.forEach((r) => {
        if (r.familyId === where.familyId) {
          Object.assign(r, data);
          count++;
        }
      });
      return { count };
    });
  });

  it('registers a new user and returns user DTO with tokens', async () => {
    const result = await authService.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      displayName: 'Alice Smith',
    });

    expect(result.user.username).toBe('alice');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(users).toHaveLength(1);
    expect(refreshTokens).toHaveLength(1);
  });

  it('fails registration when username is already taken', async () => {
    await authService.register({
      username: 'alice',
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      displayName: 'Alice Smith',
    });

    await expect(
      authService.register({
        username: 'alice',
        email: 'other@example.com',
        password: 'AnotherPassword123!',
        displayName: 'Alice Two',
      }),
    ).rejects.toThrow('Username is already taken');
  });

  it('authenticates user with valid credentials via username and email', async () => {
    await authService.register({
      username: 'bob',
      email: 'bob@example.com',
      password: 'Password123!',
      displayName: 'Bob Jones',
    });

    // Login via username
    const resUsername = await authService.login({
      login: 'bob',
      password: 'Password123!',
    });
    expect(resUsername.user.id).toBeDefined();

    // Login via email
    const resEmail = await authService.login({
      login: 'bob@example.com',
      password: 'Password123!',
    });
    expect(resEmail.user.id).toBe(resUsername.user.id);
  });

  it('rejects login with invalid password', async () => {
    await authService.register({
      username: 'bob',
      email: 'bob@example.com',
      password: 'Password123!',
      displayName: 'Bob Jones',
    });

    await expect(
      authService.login({
        login: 'bob',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow('Invalid username/email or password');
  });

  it('rotates refresh token within same family on refresh', async () => {
    const reg = await authService.register({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'Password123!',
      displayName: 'Charlie',
    });

    const initialToken = reg.refreshToken;
    const initialFamilyId = refreshTokens[0].familyId;

    // Refresh token
    const refreshed = await authService.refresh(initialToken);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).not.toBe(initialToken);

    // Old token should be revoked
    const oldHash = hashToken(initialToken);
    const oldRecord = refreshTokens.find((r) => r.tokenHash === oldHash);
    expect(oldRecord.isRevoked).toBe(true);

    // New token should share the same familyId
    const newHash = hashToken(refreshed.refreshToken);
    const newRecord = refreshTokens.find((r) => r.tokenHash === newHash);
    expect(newRecord.familyId).toBe(initialFamilyId);
    expect(newRecord.isRevoked).toBe(false);
  });

  it('detects token reuse and revokes entire token family', async () => {
    const reg = await authService.register({
      username: 'eve',
      email: 'eve@example.com',
      password: 'Password123!',
      displayName: 'Eve',
    });

    const initialToken = reg.refreshToken;
    const initialFamilyId = refreshTokens[0].familyId;

    // Legitimate client refreshes token
    const refreshed = await authService.refresh(initialToken);

    // Malicious attacker or delayed network replay tries to use old initialToken again!
    await expect(authService.refresh(initialToken)).rejects.toThrow(
      'Token reuse detected. All sessions in this family revoked.',
    );

    // ALL tokens in that family should now be revoked!
    const activeTokensInFamily = refreshTokens.filter(
      (r) => r.familyId === initialFamilyId && !r.isRevoked,
    );
    expect(activeTokensInFamily).toHaveLength(0);

    // Even the newer token cannot be used now!
    await expect(authService.refresh(refreshed.refreshToken)).rejects.toThrow(
      'Token reuse detected. All sessions in this family revoked.',
    );
  });
});
