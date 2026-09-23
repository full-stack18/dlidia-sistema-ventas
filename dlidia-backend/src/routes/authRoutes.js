import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);

export default router;