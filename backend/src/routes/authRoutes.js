import express from 'express';
import { login, me, changePassword } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, me);
router.post('/change-password', auth, changePassword);

export default router;
