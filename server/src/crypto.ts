import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

/**
 * Derives the encryption key from SESSION_SECRET. Fails loudly at startup
 * rather than silently encrypting with a default nobody rotated.
 */
function masterKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET must be set to at least 16 characters. See server/README.md',
    );
  }
  return scryptSync(secret, 'skydive-mobile-key-vault', 32);
}

/** AES-256-GCM. Returns iv.tag.ciphertext, base64url, colon-separated. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const body = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, body].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload: string): string {
  const [ivPart, tagPart, bodyPart] = payload.split('.');
  if (!ivPart || !tagPart || !bodyPart) {
    throw new Error('malformed ciphertext');
  }
  const decipher = createDecipheriv(
    ALGO,
    masterKey(),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(bodyPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function newId(): string {
  return randomBytes(16).toString('hex');
}

/** Display-safe fragment of an API key. Never the whole key. */
export function keyPrefix(key: string): string {
  return `${key.slice(0, 12)}…`;
}
