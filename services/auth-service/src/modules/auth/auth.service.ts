import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { OtpType } from '../otp/otp.constants';
import { prisma, prismaClient } from '../../lib/prisma';
import { ClientContext } from '../../types/shared.type';
import { ApiError } from '../../utils/api-error.util';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../utils/crypto.util';
import { signAccessToken, signResetToken, verifyResetToken } from '../../utils/jwt.util';
import { OtpGenerator } from '../../utils/otpGenerator';
import { emailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { SessionService } from '../session/session.service';
import { STATUS_ERROR } from './auth.constant';
import {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
} from './auth.scheme';
import { ROLE_PERMISSIONS } from '../../constants/roles';

export class AuthService {
  /**
   * Register logic: Validates user input, creates a new user in the database, and returns a success message or error if registration fails.
   * @param payload - The registration data transfer object containing user input for registration.
   */
  static async register(payload: RegisterDTO) {
    // if validation passes, extract the validated data
    const { email, password, fullName } = payload;

    // 2. Email uniqueness check
    const existingEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingEmail) {
      throw new ApiError(409, 'Email is already in use', 'EMAIL_EXISTS');
    }

    // 3. Password hashing
    const hashedPassword = await hashPassword(password);

    // 4. Store user in database
    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: hashedPassword,
        fullName: fullName,
        userProfile: {
          create: {},
        },
      },
    });

    // OTP generates
    const otp = OtpGenerator.generateOTP(6);

    // Store OTP in Redis
    await OtpService.saveOTP(newUser.email, OtpType.EMAIL_VERIFY, otp);

    // Send Email
    // dont use await avoid blocking api res for user
    emailService
      .sendEmailVerificationOTP(newUser.email, otp, newUser.fullName || 'Student')
      .catch((err) => logger.error(`Failed to send OTP email to ${newUser.email}`, err));

    // 5. Remove sensitive information before returning the user object
    const { passwordHash, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }
  /**
   * Login logic: Validates user credentials, generates access and refresh tokens, and returns them to the client.
   */
  static async login(payload: LoginDTO, context: ClientContext) {
    // if validation passes, extract the validated data
    const { email, password } = payload;

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 3. Password verification
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // check if the user is banned
    if (user.status !== 'ACTIVE') {
      const errorMessage =
        STATUS_ERROR[user.status] || 'Account is not active. Please contact support.';
      throw new ApiError(403, errorMessage, 'ACCOUNT_INACTIVE');
    }

    // 5. Generate Refresh Token and hash it before storing in database
    const rawRefreshToken = generateOpaqueToken();
    const hashedRefreshToken = hashOpaqueToken(rawRefreshToken);

    // cacl the expiration date for refresh token (e.g., 7 days)
    const expiresInDay = env.REFRESH_TOKEN_TTL_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDay);
    // 6. Store Session in database with hashed refresh token

    // add ip and device info for better session management and security monitoring
    const ip = context.ip;
    const devicesInfo = context.userAgent || 'Unknown Device';

    const session = await SessionService.createSession(
      user.id,
      hashedRefreshToken,
      expiresAt,
      devicesInfo,
      ip,
    );

    // 4. Generate Access Token
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      permissions: ROLE_PERMISSIONS[user.role] ?? [],
    });

    return {
      accessToken,
      rawRefreshToken,
      expiresInDay,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
  /**
   * Refresh token logic: Validates the refresh token, generates a new access token, and returns it to the client.
   */
  static async refreshToken(rawRefreshToken: string) {
    // 2. Hash the received Refresh Token
    const hashedRefreshToken = hashOpaqueToken(rawRefreshToken);

    // 3. Blacklist checking
    const isBlackListed = await SessionService.isTokenBlacklisted(hashedRefreshToken);
    if (isBlackListed) {
      throw new ApiError(401, 'Invalid Refresh Token', 'TOKEN_BLACKLISTED');
    }

    // 4. Find session in database
    const session = await SessionService.findValidSessionByHash(hashedRefreshToken);
    if (!session) {
      throw new ApiError(401, 'Invalid Refresh Token or Session expired', 'INVALID_SESSION');
    }

    // 5. User status check (active, banned, etc.)
    if (session.user.status !== 'ACTIVE') {
      const errorMessage =
        STATUS_ERROR[session.user.status] || 'Account is not active. Please contact support.';
      throw new ApiError(403, errorMessage, 'ACCOUNT_INACTIVE');
    }

    // --- Token Rotation ---

    // 6.1: Generate new Refresh Token
    const newRawRefreshToken = generateOpaqueToken();
    const newHashedRefreshToken = hashOpaqueToken(newRawRefreshToken);

    // 6.2: Extent expiration date
    const expiresInDay = env.REFRESH_TOKEN_TTL_DAYS;
    const newExpiresAt = new Date();

    newExpiresAt.setDate(newExpiresAt.getDate() + expiresInDay);

    // 6.3: Update session in database with new hashed refresh token and new expiration date
    await SessionService.rotateSessionToken(session.id, newHashedRefreshToken, newExpiresAt);

    // 6.4: Send old refresh token to blacklist (store in Redis with expiration) to prevent reuse
    const remainingTtlSeconds = Math.floor(
      (session.expiresAt.getTime() - new Date().getTime()) / 1000,
    );
    if (remainingTtlSeconds > 0) {
      await SessionService.blacklistToken(hashedRefreshToken, remainingTtlSeconds);
    }

    // 7. Generate new Access Token
    const newAccessToken = signAccessToken({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sessionId: session.id,
      permissions: ROLE_PERMISSIONS[session.user.role] ?? [],
    });

    return {
      newAccessToken,
      newRawRefreshToken,
      expiresInDay,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    };
  }
  /**
   * Lougout logic: Invalidates the refresh token, effectively logging the user out and preventing further use of that token.
   */
  static async logout(rawRefreshToken: string) {
    // 2. session check and revoke session in database (set revokedAt)
    const hashedRefreshToken = hashOpaqueToken(rawRefreshToken);
    if (!hashedRefreshToken) {
      logger.warn('Logout attempt with invalid refresh token format');
      return;
    }
    const session = await SessionService.findValidSessionByHash(hashedRefreshToken);

    if (!session) {
      logger.warn(
        `Logout attempt with invalid or already revoked refresh token (Hash: ${hashedRefreshToken})`,
      );
      return;
    }

    if (session) {
      logger.info(`Revoking session for user ${session.user.email} (Session ID: ${session.id})`);
      // Revoke session in database
      await SessionService.revokeSession(session.id);

      // send old refresh token to blacklist (store in Redis with expiration) to prevent reuse until it expires
      const remainingTtlSeconds = Math.floor(
        (session.expiresAt.getTime() - new Date().getTime()) / 1000,
      );
      if (remainingTtlSeconds > 0) {
        await SessionService.blacklistToken(hashedRefreshToken, remainingTtlSeconds);
      }
    }
  }
  /**
   * Verify email
   */
  static async verifyEmail(payload: VerifyEmailDTO) {
    const { email, otp } = payload;

    // 1. find user in db
    const user = await prismaClient.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // 2. threw error if email already verified
    if (user.emailVerified) {
      throw new ApiError(400, 'Email already verified', 'EMAIL_ALREADY_VERIFIED');
    }

    // 3. Verify OTP
    await OtpService.validateOTP(email, OtpType.EMAIL_VERIFY, otp);

    // 4. Update emailVerified in db
    await prismaClient.user.update({
      where: { email },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // 5. Send Welcome email
    emailService
      .sendWelcomeEmail(email, user.fullName || 'Student')
      .catch((err) => logger.error(`Failed to send welcome email to ${email}: ${err.message}`));

    return { message: 'Email verified successfully' };
  }

  //--- [Reset Password Flow] ---

  // [Reset-1] User submits email to request password reset -> generate OTP and send email
  /**
   * Gen OTP and send email
   * @param payload - The 'forgot password data transfer' object containing user 'email' for password reset.
   * @returns A success message indicating that if the email is registered and verified, a password reset OTP will be sent. Note that this response is returned regardless of whether the email exists or is verified to prevent 'Email Enumeration' attacks.
   */
  static async forgotPassword(payload: ForgotPasswordDTO) {
    const { email } = payload;

    // 1. find user
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    // Sec best practise: always return success response to prevent 'Email Enumeration', even if user not found or email not verified
    if (!user) {
      return {
        message: 'If the email is registered and verified, you will receive a password reset OTP.',
      };
    }

    // 2. gen otp
    const otp = OtpGenerator.generateOTP(6);
    await OtpService.saveOTP(email, OtpType.PASSWORD_RESET, otp);

    // 3. send email (dont use await avoid blocking api res for user)
    emailService
      .sendPasswordResetEmail(email, otp, user?.fullName || 'Student')
      .catch((err) =>
        logger.error(`Failed to send password reset OTP email to ${email}: ${err.message}`),
      );

    return {
      message: 'If the email is registered and verified, you will receive a password reset OTP.',
    };
  }

  // [Reset-2] User submits email and OTP to verify -> verify OTP and return a short-lived reset token (JWT or opaque token)
  /**
   * Review OTP and gen reset token
   * @param payload - The 'verify reset token data transfer' object containing user 'email' and 'otp' for password reset verification.
   * @returns A short-lived reset token (JWT or opaque token) that can be used to authenticate the subsequent password reset request. This token should have a very short expiration time (e.g., 15 minutes) to enhance security.
   */
  static async verifyResetOtp(payload: VerifyEmailDTO) {
    const { email, otp } = payload;

    // 1. find user
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // 2. verify OTP
    await OtpService.validateOTP(email, OtpType.PASSWORD_RESET, otp);

    // 3. Gen JWT
    const resetToken = signResetToken(user.id);

    return {
      message: 'OTP verified successfully. Use the reset token to reset your password.',
      resetToken,
    };
  }

  // [Reset-3] User submits new password along with the reset token -> update password and revoke sessions
  /**
   * Reset the user's password and revoke all active sessions
   * @param payload - The ResetPasswordDTO containing the 'token' and 'newPassword'
   * @returns A success message
   */
  static async resetPassword(payload: ResetPasswordDTO) {
    const { token, newPassword } = payload;

    let decoded;

    try {
      // 1. Verify reset token
      decoded = verifyResetToken(token);
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    // 2. hash new password
    const hashedPassword = await hashPassword(newPassword);

    // 3. Execute Transaction: Upate pass & Revorke all existing session
    await prismaClient.$transaction([
      // update new pass
      prismaClient.user.update({
        where: { id: decoded.sub },
        data: { passwordHash: hashedPassword },
      }),

      // delete all old session
      prismaClient.userSession.deleteMany({
        where: { userId: decoded.sub },
      }),
    ]);

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }
}
