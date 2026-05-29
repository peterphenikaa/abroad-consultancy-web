import { User } from '@prisma/client';
import z from 'zod';
import { logger } from '../../config/logger';
import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyResetTokenSchema,
} from './auth.scheme';
import { AuthService } from './auth.service';
import { ClientContext } from '../../types/shared.type';
import { ApiError } from '../../utils/api-error.util';
import { AuthUser } from '../../types/express';

export class AuthController {
  /**
   * API for registering a new user
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validate request body using Zod
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        const flattened_err = z.flattenError(parseResult.error).fieldErrors;

        throw new ApiError(400, 'Registration Validation Error', 'VALIDATION_ERROR', flattened_err);
      }

      // Register with auth service
      const newUser = await AuthService.register(parseResult.data);

      // 6. Return success response or error
      logger.info(`User registered successfully: ${newUser.email}`);
      res.status(201).json({
        message: 'User registered successfully! Please checks your email to verify your account',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          emailVerified: newUser.emailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * API for user login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validate request body using Zod
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        const flattened_err = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(400, 'Registration Validation Error', 'VALIDATION_ERROR', flattened_err);
      }

      // add ip and device info for better session management and security monitoring
      const ip = req.ip || req.socket.remoteAddress;
      const devicesInfo = req.headers['user-agent'] || 'Unknown Device';

      // create context object to pass to service layer, can be used for logging, security checks, etc.
      const context: ClientContext = { ip: ip, userAgent: devicesInfo };

      const result = await AuthService.login(parseResult.data, context);

      // 7. Attach refresh token in HttpOnly cookie and return access token in response body
      res.cookie('refresh_token', result.rawRefreshToken, {
        httpOnly: true, // JavaScript cannot access this cookie, helps prevent XSS attacks
        secure: env.COOKIE_SECURE, // Set to true in production (requires HTTPS)
        domain: env.COOKIE_DOMAIN, // domain for which the cookie is valid, e.g., '.example.com' for all subdomains
        sameSite: 'strict', // Controls whether the cookie is sent with cross-site requests, helps prevent CSRF attacks
        maxAge: result.expiresInDay * 24 * 60 * 60 * 1000, // ms, should match the expiration of the refresh token in the database
      });

      // 8. Return the res
      logger.info(`User logged in successfully: ${result.user.email}`);
      res.status(200).json({
        access_token: result.accessToken,
        token_type: 'Bearer',
        expires_in: env.ACCESS_TOKEN_TTL_SECONDS,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * API for Refreshing Access Token
   * called when access token is expired, client can use the refresh token in cookie to get a new access token
   */
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Take Refresh Token from HttpOnly cookie
      const rawRefreshToken = req.cookies?.refresh_token;
      if (!rawRefreshToken) {
        throw new ApiError(401, 'Cannot find session. Please login again.', 'UNAUTHORIZED');
      }

      const result = await AuthService.refreshToken(rawRefreshToken);

      // 8. Attach new refresh token in HttpOnly cookie
      res.cookie('refresh_token', result.newRawRefreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        domain: env.COOKIE_DOMAIN,
        sameSite: 'strict',
        maxAge: result.expiresInDay * 24 * 60 * 60 * 1000,
      });

      // 9. Return new access token in response body
      logger.info(`Access token refreshed successfully for user: ${result.user.email}`);
      res.status(200).json({
        access_token: result.newAccessToken,
        token_type: 'Bearer',
        expires_in: env.ACCESS_TOKEN_TTL_SECONDS,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * API for user logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. take refresh token from cookie
      const rawRefreshToken = req.cookies?.refresh_token;

      // 2. if refresh token exists, logout (idempotent - always returns 200 OK)
      if (rawRefreshToken) {
        await AuthService.logout(rawRefreshToken);
      }

      // 3. delete cookie in client
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        domain: env.COOKIE_DOMAIN,
        sameSite: 'strict',
      });

      // 4. return res (always success - already logged out if no token)
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email with OTP
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Validate request body using Zod
      const parseResult = verifyEmailSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(400, 'Email Verification Validation Error', 'VALIDATION_ERROR', errors);
      }

      // 2. Call service to verify email
      const result = await AuthService.verifyEmail(parseResult.data);

      // 3. Return success response or error
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [RESET-1]
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = forgotPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(400, 'Forgot Password Validation Error', 'VALIDATION_ERROR', errors);
      }

      const result = await AuthService.forgotPassword(parseResult.data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [RESET-2]
   */
  static async verifyResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = verifyResetTokenSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(400, 'Verify Reset Token Validation Error', 'VALIDATION_ERROR', errors);
      }

      const result = await AuthService.verifyResetOtp(parseResult.data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * [RESET-3]
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parseResult = resetPasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(
          400,
          'Verify Reset Password Validation Error',
          'VALIDATION_ERROR',
          errors,
        );
      }

      const result = await AuthService.resetPassword(parseResult.data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- Google OAuth SSO ---
  /**
   * API for Google SSO Callback
   */
  static async googleCallBack(req: Request, res: Response): Promise<void> {
    try {
      // Passport will auto attach user info, we cast it to User since we know Passport puts the DB record here
      const user = req.user as unknown as User;

      if (!user) {
        logger.warn('Google OAuth callback called without user info');
        res.redirect(`${env.FRONTEND_OAUTH_SUCCESS_URL}?error=unauthorized`);
        return;
      }

      // add ip and device info for better session management and security monitoring
      const ip = req.ip || req.socket.remoteAddress;
      const devicesInfo = req.headers['user-agent'] || 'Unknown Device';
      const context: ClientContext = { ip: ip, userAgent: devicesInfo };

      // call google login in service
      const result = await AuthService.googleLogin(user, context);

      // Attach refresh token in HttpOnly cookie
      res.cookie('refresh_token', result.rawRefreshToken, {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        domain: env.COOKIE_DOMAIN,
        sameSite: 'lax', // Use 'lax' or 'none' for OAuth callbacks depending on cross-domain requirements
        maxAge: result.expiresInDay * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with the access token
      // WARNING: Passing token in URL hash is common but consider more secure alternatives (like secure cookies) for production
      const redirectUrl = `${env.FRONTEND_OAUTH_SUCCESS_URL}#access_token=${result.accessToken}&expires_in=${env.ACCESS_TOKEN_TTL_SECONDS}`;

      logger.info(`User logged in via Google successfully: ${result.user.email}`);
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error({ err: error }, 'Google OAuth callback failed');

      if (error instanceof ApiError) {
        // transfer true err code
        return res.redirect(`${env.FRONTEND_OAUTH_SUCCESS_URL}?error=${error.code}`);
      }

      res.redirect(`${env.FRONTEND_OAUTH_SUCCESS_URL}?error=server_error`);
    }
  }

  /**
   * Change pass
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // user check
      const user = req.user;
      if (!user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      // req.body check
      const parseResult = changePasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = z.flattenError(parseResult.error).fieldErrors;
        throw new ApiError(400, 'Change Password Validation Error', 'VALIDATION_ERROR', errors);
      }

      // auth service call
      const result = await AuthService.changePassword(user.id, parseResult.data);
      res.status(200).json(result);
      // response
    } catch (error) {
      next(error);
    }
  }
}
