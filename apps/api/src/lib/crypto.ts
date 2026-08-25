import crypto from "crypto";

/**
 * Hash a token with SHA-256. Used for storing tokens and access tokens.
 * NEVER store raw tokens in the database.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a cryptographically secure random token.
 * Default: 32 bytes = 64 hex characters
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Compare a raw token against its stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const inputHash = hashToken(rawToken);
  const inputBuf = Buffer.from(inputHash, "hex");
  const storedBuf = Buffer.from(storedHash, "hex");

  if (inputBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(inputBuf, storedBuf);
}

/**
 * Generate a short alphanumeric code (e.g. for invite codes shown to users).
 * Not for security tokens — use generateToken() for those.
 */
export function generateShortCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
