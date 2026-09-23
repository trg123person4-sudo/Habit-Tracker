import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db/client.js';

describe('Auth REST Endpoints (/api/v1/auth)', () => {
  const app = createApp();

  let users: any[] = [];
  let refreshTokens: any[] = [];

  beforeEach(() => {
    users = [];
    refreshTokens = [];

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
        refreshTokens.push({
          id: 'rt_1',
          tokenHash: data.refreshTokens.create.tokenHash,
          userId: user.id,
          familyId: data.refreshTokens.create.familyId,
          isRevoked: false,
          expiresAt: data.refreshTokens.create.expiresAt,
          createdAt: new Date(),
          user,
        });
      }
      return user;
    });

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

  it('POST /api/v1/auth/register registers a user and sets httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'alice',
        email: 'alice@example.com',
        password: 'Password123!',
        displayName: 'Alice Smith',
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.user.username).toBe('alice');
    expect(res.body.data.accessToken).toBeDefined();

    // Check Set-Cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken=');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Strict');
  });

  it('POST /api/v1/auth/login logs in user and returns tokens', async () => {
    // First register
    await request(app).post('/api/v1/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'Password123!',
      displayName: 'Bob Jones',
    });

    // Login
    const res = await request(app).post('/api/v1/auth/login').send({
      login: 'bob',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/v1/auth/me returns current user when authenticated with Bearer token', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send({
      username: 'charlie',
      email: 'charlie@example.com',
      password: 'Password123!',
      displayName: 'Charlie',
    });

    const token = regRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.ok).toBe(true);
    expect(meRes.body.data.user.username).toBe('charlie');
  });

  it('GET /api/v1/auth/me rejects requests without valid Bearer token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
