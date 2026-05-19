import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// ─── Hash & Compare ───────────────────────────────────────────

export const hashPassword = async (plaintext: string): Promise<string> => {
  return bcrypt.hash(plaintext, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  plaintext: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(plaintext, hash);
};

// ─── Crypto-safe random string ───────────────────────────────

import crypto from 'crypto';

export const generateSecureToken = (bytes = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateNumericOTP = (digits = 6): string => {
  const max = Math.pow(10, digits);
  return crypto.randomInt(0, max).toString().padStart(digits, '0');
};
