import express from 'express';
import auth from '../middleware/auth.js';
import { login, me, changePassword, impersonate } from '../controllers/authController.js';


const router = express.Router();

router.post('/login', login);
router.get('/me', auth, me);
router.post('/change-password', auth, changePassword);
router.post('/impersonate/:userId', auth, impersonate); 

export default router;
