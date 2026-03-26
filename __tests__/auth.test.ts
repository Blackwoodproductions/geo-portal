jest.mock('@/lib/db', () => ({ prisma: {} }));
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: { json: jest.fn() },
}));

import { signToken, verifyToken, hashPassword, comparePassword } from '@/lib/auth';

describe('Auth utilities', () => {
  describe('signToken / verifyToken', () => {
    it('should sign and verify a token', () => {
      const token = signToken('user-123', 0);
      const payload = verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe('user-123');
      expect(payload!.tokenVersion).toBe(0);
    });

    it('should return null for invalid token', () => {
      expect(verifyToken('garbage')).toBeNull();
    });

    it('should return null for token signed with wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ userId: 'user-123' }, 'wrong-secret');
      expect(verifyToken(token)).toBeNull();
    });

    it('should return null for expired token', () => {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
      const token = jwt.sign({ userId: 'user-123', tokenVersion: 0 }, secret, { expiresIn: '-1s' });
      expect(verifyToken(token)).toBeNull();
    });
  });

  describe('hashPassword / comparePassword', () => {
    it('should hash and verify a password', async () => {
      const hash = await hashPassword('mypassword123');
      expect(hash).not.toBe('mypassword123');
      expect(await comparePassword('mypassword123', hash)).toBe(true);
      expect(await comparePassword('wrongpassword', hash)).toBe(false);
    });
  });
});
