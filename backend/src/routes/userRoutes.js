import express from 'express';
import { getUsers, createUser, updateUser, resetPassword, getByRole } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/', getUsers);
router.get('/by-role/:role', getByRole);
router.post('/', requireRole('ADMIN'), createUser);
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), updateUser);
router.post('/:id/reset-password', requireRole('ADMIN'), resetPassword);

export default router;
