import { Router } from 'express';
import { AuthController } from './auth.controller';
import {
  googleAuthCallback,
  googleAuthInit,
  ssoErrorHandler,
} from '../../middleware/sso.middleware';
import { validateToken } from '../../middleware/validateToken';

const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/verify-email', AuthController.verifyEmail);

// --- Password Reset ---
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);
authRouter.post('/reset-password/verify-otp', AuthController.verifyResetOtp);

// --- Change Password ---
authRouter.put('/change-password', validateToken, AuthController.changePassword);

// --- Google OAuth SSO ---
authRouter.get('/google', googleAuthInit);

authRouter.get(
  // 1. endpoint
  '/google/callback',

  // 2. middleware
  googleAuthCallback,

  // 3. controller handler
  AuthController.googleCallBack,

  // 4. error handler for any unexpected errors during the SSO process
  ssoErrorHandler,
);

export default authRouter;
