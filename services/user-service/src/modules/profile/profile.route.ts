import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { validateToken } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', validateToken, ProfileController.getMe);
router.put('/me', validateToken, ProfileController.updateMe);

export { router as profileRouter };
