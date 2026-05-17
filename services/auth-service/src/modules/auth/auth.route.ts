import { Router } from 'express';
import { AuthController } from './auth.controller';

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

export default authRouter;
