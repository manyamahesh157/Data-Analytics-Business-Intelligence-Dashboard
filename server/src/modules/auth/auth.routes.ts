import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  orgSlug: z.string().optional(),
});

const registerSchema = z.object({
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  orgSlug: z.string().min(2, 'Organization slug is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', authMiddleware, AuthController.getProfile);

export default router;
