import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  generateSecureToken,
  hashToken,
} from './crypto.js';

describe('Crypto Utilities (Argon2id & Jose JWT)', () => {
  it('hashes and verifies passwords correctly with Argon2id', async () => {
    const plain = 'SuperSecretP@ssword123';
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword(hash, 'WrongPassword456');
    expect(isWrongValid).toBe(false);
  });

  it('signs and verifies Jose JWT access tokens', async () => {
    const payload = { userId: 'user_123', username: 'alice' };
    const token = await signAccessToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifyAccessToken(token);
    expect(verified.userId).toBe(payload.userId);
    expect(verified.username).toBe(payload.username);
  });

  it('fails verification on invalid or tampered tokens', async () => {
    await expect(verifyAccessToken('invalid.token.structure')).rejects.toThrow();
  });

  it('generates cryptographically secure random tokens and SHA-256 hashes', () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).toHaveLength(64); // 32 bytes hex
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);

    const hash1 = hashToken(token1);
    const hash2 = hashToken(token1);
    const hash3 = hashToken(token2);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });
});
