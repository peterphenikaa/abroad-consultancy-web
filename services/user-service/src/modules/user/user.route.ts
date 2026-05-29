import { Router } from 'express';
import { UserController } from './user.controller';
import { validateToken, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', validateToken, requireRole('SUPER_ADMIN', 'ORG_ADMIN'), UserController.listUsers);
router.get('/:userId', validateToken, UserController.getUserById);
router.post('/internal/sync', UserController.syncUser);

export { router as userAdminRouter };
