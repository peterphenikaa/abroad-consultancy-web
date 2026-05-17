import { logger } from '../../config/logger';
import { OTP_TTL, OtpType } from './otp.constants';
import { redisClient } from '../../lib/redis';
import { ApiError } from '../../utils/api-error.util';

export class OtpService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMP_WINDOW_SECONDS = 5 * 60;

  /**
   * Store OTP in Redis
   * @param identifier Email or Phone number
   */
  static async saveOTP(identifier: string, type: OtpType, otp: string): Promise<void> {
    const key = `otp:${type}:${identifier}`;
    const ttl = OTP_TTL[type] || 600;

    await redisClient.setex(key, ttl, otp);
    logger.info(`OTP gennerated for ${identifier} with type ${type}`);
  }

  /**
   * Validate the user OTP
   * @param identifier Email or Phone number
   * @param type The type of OTP (e.g., EMAIL_VERIFY, PHONE_VERIFY, PASSWORD_RESET, 2FA_SMS)
   * @param userProvidedOtp The OTP provided by the user for validation
   * @returns true if the OTP is valid, otherwise throws an ApiError with appropriate message and status code
   */
  static async validateOTP(
    identifier: string,
    type: OtpType,
    userProvidedOtp: string,
  ): Promise<boolean> {
    const attemptKey = `otp_attempts:${type}:${identifier}`;
    const otpKey = `otp:${type}:${identifier}`;

    // 1. Rate Limit Check
    const attempts = await redisClient.get(attemptKey);
    if (attempts && parseInt(attempts) >= OtpService.MAX_ATTEMPTS) {
      throw new ApiError(
        429,
        'Too many failed attempts. Please try again in 5 minute.',
        'RATE_LIMIT_EXCEEDED',
      );
    }

    // 2. Take OTP from Redis
    const validOtp = await redisClient.get(otpKey);
    if (!validOtp) {
      throw new ApiError(400, 'OTP has expired or does not exist.', 'OTP_EXPIRED');
    }

    // 3. Compare OTP
    if (validOtp !== userProvidedOtp) {
      const newAttempts = await redisClient.incr(attemptKey);
      if (newAttempts === 1) {
        await redisClient.expire(attemptKey, OtpService.ATTEMP_WINDOW_SECONDS);
      }
      throw new ApiError(400, 'Invalid OTP. Please try again.', 'INVALID_OTP');
    }

    // 4. Success -> delete OTP & attempt record
    await redisClient.del(otpKey);
    await redisClient.del(attemptKey);

    return true;
  }

  /**
   * Delete OTP from Redis
   * @param identifier Email or Phone number
   * @param type The type of OTP (e.g., EMAIL_VERIFY, PHONE_VERIFY, PASSWORD_RESET, 2FA_SMS)
   */
  static async deleteOTP(indentifier: string, type: OtpType): Promise<void> {
    await redisClient.del(`otp:${type}:${indentifier}`);
  }
}
