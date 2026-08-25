/**
 * Hash a token with SHA-256. Used for storing tokens and access tokens.
 * NEVER store raw tokens in the database.
 */
export declare function hashToken(token: string): string;
/**
 * Generate a cryptographically secure random token.
 * Default: 32 bytes = 64 hex characters
 */
export declare function generateToken(bytes?: number): string;
/**
 * Compare a raw token against its stored hash.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export declare function verifyToken(rawToken: string, storedHash: string): boolean;
/**
 * Generate a short alphanumeric code (e.g. for invite codes shown to users).
 * Not for security tokens — use generateToken() for those.
 */
export declare function generateShortCode(length?: number): string;
//# sourceMappingURL=crypto.d.ts.map