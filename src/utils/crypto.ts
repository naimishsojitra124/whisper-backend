import crypto from 'crypto';
import { FastifyInstance } from 'fastify';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from the configured secret.
function getKey(fastify: FastifyInstance): Buffer {
  const secret = fastify.config.TWO_FACTOR_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      'TWO_FACTOR_ENCRYPTION_KEY is not configured'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'TWO_FACTOR_ENCRYPTION_KEY must be at least 32 characters long'
    );
  }

  // SHA-256 → 32 bytes
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Output format (base64):
 * [ IV (12) | AUTH TAG (16) | CIPHERTEXT ]
 */
export function encrypt(
  fastify: FastifyInstance,
  plaintext: string
): string {
  const key = getKey(fastify);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authTag,
    ciphertext,
  ]).toString('base64');
}

// Decrypt AES-256-GCM payload.
export function decrypt(
  fastify: FastifyInstance,
  encryptedData: string
): string {
  const key = getKey(fastify);
  const data = Buffer.from(encryptedData, 'base64');

  if (data.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(
    IV_LENGTH,
    IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = data.subarray(
    IV_LENGTH + AUTH_TAG_LENGTH
  );

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
