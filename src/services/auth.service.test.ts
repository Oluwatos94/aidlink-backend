import { AuthService } from './auth.service';
import { CryptoUtils } from '../utils/crypto';
import { AppError } from '../middleware/error';
import { UserStatus, Role } from '@prisma/client';

// Mocks
jest.mock('../config/database');
jest.mock('../config/redis', () => ({
  __esModule: true,
  default: { incr: jest.fn(), expire: jest.fn() },
}));
jest.mock('./notification.service', () => ({
  NotificationService: { sendEmail: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));

import prisma from '../config/database';
import redis from '../config/redis';
import { NotificationService } from './notification.service';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRedis = redis as jest.Mocked<typeof redis>;

// Helper to build a user-like object
function makeUser(overrides: Partial<any> = {}): any {
  return {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed',
    role: Role.DONOR,
    status: UserStatus.PENDING_VERIFICATION,
    emailVerified: false,
    verificationToken: null,
    verificationExpiry: null,
    failedVerifyAttempts: 0,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService – email verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────
  // Token generation
  // ────────────────────────────────────────────────
  describe('CryptoUtils.generateVerificationToken', () => {
    it('generates a base64url string of at least 43 characters (32 bytes)', () => {
      const token = CryptoUtils.generateVerificationToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThanOrEqual(43);
      // base64url charset
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('generates unique tokens on each call', () => {
      const t1 = CryptoUtils.generateVerificationToken();
      const t2 = CryptoUtils.generateVerificationToken();
      expect(t1).not.toBe(t2);
    });

    it('sha256 hash produces deterministic 64-char hex', () => {
      const token = 'test-token';
      const h1 = CryptoUtils.sha256(token);
      const h2 = CryptoUtils.sha256(token);
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ────────────────────────────────────────────────
  // register
  // ────────────────────────────────────────────────
  describe('register', () => {
    it('creates user with hashed token and 24-hour expiry', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(makeUser({ id: 'user-1' }));
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.register({ email: 'test@example.com', password: 'password123' });

      expect(result.userId).toBe('user-1');
      expect(result.message).toMatch(/verify/i);

      const createCall = (mockPrisma.user.create as jest.Mock).mock.calls[0][0].data;
      expect(createCall.emailVerified).toBeUndefined(); // not set on create
      expect(createCall.verificationToken).toBeDefined();
      expect(createCall.verificationExpiry).toBeDefined();

      // Expiry should be ~24 hours in future
      const expiry: Date = createCall.verificationExpiry;
      const diffHours = (expiry.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });

    it('normalizes email to lowercase', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(makeUser({ email: 'test@example.com' }));
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.register({ email: 'TEST@Example.COM', password: 'password123' });

      const emailQueried = (mockPrisma.user.findUnique as jest.Mock).mock.calls[0][0].where.email;
      expect(emailQueried).toBe('test@example.com');
    });

    it('throws 409 if email already exists', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser());

      await expect(
        AuthService.register({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(AppError);
    });

    it('stores token hash (not plaintext) in DB and does not return token in response', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(makeUser());
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.register({ email: 'test@example.com', password: 'pass12345' });

      const storedToken = (mockPrisma.user.create as jest.Mock).mock.calls[0][0].data.verificationToken;
      // Must be 64-char hex (SHA-256), not a raw base64url token
      expect(storedToken).toMatch(/^[a-f0-9]{64}$/);
      // Token must not appear in response
      expect(JSON.stringify(result)).not.toContain(storedToken);
    });

    it('queues verification email without blocking response', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(makeUser());
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.register({ email: 'test@example.com', password: 'pass12345' });

      // Give async send a tick to run
      await new Promise((r) => setImmediate(r));
      expect(NotificationService.sendEmail).toHaveBeenCalledTimes(1);
      const [to, subject] = (NotificationService.sendEmail as jest.Mock).mock.calls[0];
      expect(to).toBe('test@example.com');
      expect(subject).toMatch(/verify/i);
    });
  });

  // ────────────────────────────────────────────────
  // verifyEmail
  // ────────────────────────────────────────────────
  describe('verifyEmail', () => {
    it('marks user verified and clears token on valid token', async () => {
      const token = CryptoUtils.generateVerificationToken();
      const tokenHash = CryptoUtils.sha256(token);
      const user = makeUser({
        verificationToken: tokenHash,
        verificationExpiry: new Date(Date.now() + 60_000),
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ ...user, emailVerified: true });
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.verifyEmail(token);

      const updateData = (mockPrisma.user.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.emailVerified).toBe(true);
      expect(updateData.verificationToken).toBeNull();
      expect(updateData.verificationExpiry).toBeNull();
      expect(updateData.failedVerifyAttempts).toBe(0);
    });

    it('throws 400 on invalid (unknown) token', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(AuthService.verifyEmail('bogus-token')).rejects.toThrow(AppError);
    });

    it('throws 400 and increments failed attempts on expired token', async () => {
      const token = CryptoUtils.generateVerificationToken();
      const tokenHash = CryptoUtils.sha256(token);
      const user = makeUser({
        verificationToken: tokenHash,
        verificationExpiry: new Date(Date.now() - 1000), // past
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await expect(AuthService.verifyEmail(token)).rejects.toThrow(AppError);

      const updateData = (mockPrisma.user.update as jest.Mock).mock.calls[0][0].data;
      expect(updateData.failedVerifyAttempts).toEqual({ increment: 1 });
    });

    it('returns gracefully if user is already verified', async () => {
      const token = CryptoUtils.generateVerificationToken();
      const tokenHash = CryptoUtils.sha256(token);
      const user = makeUser({ emailVerified: true, verificationToken: tokenHash });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      await expect(AuthService.verifyEmail(token)).resolves.toBeUndefined();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws 429 when failed attempts exceed limit', async () => {
      const token = CryptoUtils.generateVerificationToken();
      const tokenHash = CryptoUtils.sha256(token);
      const user = makeUser({
        verificationToken: tokenHash,
        failedVerifyAttempts: 10,
        verificationExpiry: new Date(Date.now() + 60_000),
      });

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await expect(AuthService.verifyEmail(token)).rejects.toThrow(AppError);
    });
  });

  // ────────────────────────────────────────────────
  // resendVerificationEmail
  // ────────────────────────────────────────────────
  describe('resendVerificationEmail', () => {
    it('issues a new token and sends email for unverified user', async () => {
      const user = makeUser();
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.resendVerificationEmail('test@example.com');

      expect(result.message).toMatch(/sent/i);
      expect(mockPrisma.user.update).toHaveBeenCalled();

      await new Promise((r) => setImmediate(r));
      expect(NotificationService.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('returns alreadyVerified for a verified user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser({ emailVerified: true }));

      const result = await AuthService.resendVerificationEmail('test@example.com');

      expect(result.alreadyVerified).toBe(true);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('throws 429 after exceeding rate limit', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser());
      (mockRedis.incr as jest.Mock).mockResolvedValue(4); // > RESEND_RATE_LIMIT (3)
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);

      await expect(AuthService.resendVerificationEmail('test@example.com')).rejects.toThrow(AppError);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('does not reveal non-existence of email (returns generic message)', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.resendVerificationEmail('nobody@example.com');

      expect(result.message).toMatch(/if that email/i);
      expect(NotificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('sets new 24-hour expiry on resend', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(makeUser());
      (mockRedis.incr as jest.Mock).mockResolvedValue(1);
      (mockRedis.expire as jest.Mock).mockResolvedValue(1);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.verificationLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.resendVerificationEmail('test@example.com');

      const updateData = (mockPrisma.user.update as jest.Mock).mock.calls[0][0].data;
      const diffHours = (updateData.verificationExpiry.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23);
      expect(diffHours).toBeLessThan(25);
    });
  });

  // ────────────────────────────────────────────────
  // login
  // ────────────────────────────────────────────────
  describe('login', () => {
    it('rejects unverified user with 403 and EMAIL_NOT_VERIFIED code', async () => {
      const user = makeUser({ emailVerified: false });
      // Need to mock the password check
      jest.spyOn(CryptoUtils, 'comparePassword').mockResolvedValue(true);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('allows login for verified user', async () => {
      const user = makeUser({ emailVerified: true, status: UserStatus.ACTIVE });
      jest.spyOn(CryptoUtils, 'comparePassword').mockResolvedValue(true);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(user);
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.login({ email: 'test@example.com', password: 'password123' });

      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user.emailVerified).toBe(true);
    });

    it('sanitized user never exposes verificationToken, passwordHash, or failedVerifyAttempts', async () => {
      const user = makeUser({ emailVerified: true, status: UserStatus.ACTIVE });
      jest.spyOn(CryptoUtils, 'comparePassword').mockResolvedValue(true);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(user);
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.login({ email: 'test@example.com', password: 'password123' });

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('verificationToken');
      expect(result.user).not.toHaveProperty('failedVerifyAttempts');
    });
  });
});
