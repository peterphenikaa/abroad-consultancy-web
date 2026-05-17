import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { env } from '../config/env';
import passport from '../config/passport';

/**
 * Middleware to initiate Google OAuth SSO flow. This will redirect the user to Google's consent screen.
 */
export const googleAuthInit = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * Middleware to handle the callback from Google after user consents. This will authenticate the user and then pass control to the controller handler. If authentication fails (e.g., user denied consent), it will redirect to the frontend with an error message.
 */
export const googleAuthCallback = passport.authenticate('google', {
  session: false,
  failureRedirect: `${env.FRONTEND_OAUTH_SUCCESS_URL}?error=access_denied`,
});

/**
 * Global error handler for SSO routes. This will catch any unexpected errors during the SSO process and redirect the user to the frontend with a generic error message.
 */
export const ssoErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Google SSO error occurred');
  res.redirect(`${env.FRONTEND_OAUTH_SUCCESS_URL}?error=server_error`);
};
