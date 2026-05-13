import { Router } from 'express';
import { AuthController } from './auth.controller';

const authRouter = Router();

authRouter.post('/register', AuthController.register);
authRouter.post('/login', AuthController.login);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/logout', AuthController.logout);
authRouter.post('/verify-email', AuthController.verifyEmail);

export default authRouter;
