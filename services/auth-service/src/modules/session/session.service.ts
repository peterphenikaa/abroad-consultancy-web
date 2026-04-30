import { prismaClient } from '../../lib/prisma';
import { redisClient } from '../../lib/redis';

export class SessionService {
  /**
   * 1. Create Session (when login)
   */
  static async createSession(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    devicesInfo?: string,
    ip?: string,
  ) {
    return prismaClient.userSession.create({
      data: {
        user_id: userId,
        refresh_token_hash: refreshTokenHash,
        expires_at: expiresAt,
        device_info: devicesInfo,
        ip: ip,
      },
    });
  }

  /**
   * 2. Retrieve valid session for token refresh
   * Criteria: Hash matches, not revoked (revokedAt is null), and not expired.
   */
  static async findValidSessionByHash(refreshTokenHash: string) {
    return prismaClient.userSession.findFirst({
      where: {
        refresh_token_hash: refreshTokenHash,
        revoked_at: null,
        expires_at: {
          gt: new Date(), // Ensure session is still valid
        },
      },
      include: { user: true }, // Include user details if needed
    });
  }

  /**
   * 3. Token Rotation
   */
  static async rotateSessionToken(
    sessionId: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ) {
    return prismaClient.userSession.update({
      where: { id: sessionId },
      data: {
        refresh_token_hash: newRefreshTokenHash,
        last_used_at: new Date(), // Update last used timestamp
        expires_at: newExpiresAt, // Extend session validity
      },
    });
  }

  /**
   * 4. Revoke Session (when logout or token compromise)
   */
  static async revokeSession(sessionId: string) {
    return prismaClient.userSession.update({
      where: { id: sessionId },
      data: {
        revoked_at: new Date(), // Mark session as revoked
      },
    });
  }

  /**
   * 5. Add old token into Blacklist
   * Using redis to block old refresh token until it expires, preventing reuse.
   */
  static async blacklistToken(hash: string, expiresInSeconds: number) {
    if (expiresInSeconds <= 0) return;
    const key = `auth:refresh:blacklist:${hash}`;

    // store in redis with expiration
    await redisClient.setex(key, expiresInSeconds, 'revoked');
  }

  /**
   * 6. Validate blacklisted token
   */
  static async isTokenBlacklisted(hash: string): Promise<boolean> {
    const key = `auth:refresh:blacklist:${hash}`;
    const exists = await redisClient.exists(key);

    return exists === 1; // If key exists, token is blacklisted
  }
}
