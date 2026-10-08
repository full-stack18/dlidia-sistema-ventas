import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

router.post('/login', loginRateLimit, login);

export default router;