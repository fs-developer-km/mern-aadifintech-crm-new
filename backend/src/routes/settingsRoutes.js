import express from 'express';
import auth from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import {
  getSettings, updateOrg, updateSystemSettings,
  getRules, saveRule, toggleRule, deleteRule,
  updatePermissions, addToList, addProduct, getActivities
} from '../controllers/settingsController.js';

const router = express.Router();

// GET /settings is PUBLIC — returns defaults if no token
// This stops the 401 loop on page load before login
router.get('/', getSettings);
router.get('/activities', getActivities);

// All write routes require auth
router.patch('/org', auth, requireRole('ADMIN'), updateOrg);
router.patch('/system', auth, requireRole('ADMIN'), updateSystemSettings);
router.get('/rules', auth, getRules);
router.post('/rules', auth, requireRole('ADMIN', 'MANAGER'), saveRule);
router.patch('/rules/:index/toggle', auth, requireRole('ADMIN', 'MANAGER'), toggleRule);
router.delete('/rules/:index', auth, requireRole('ADMIN', 'MANAGER'), deleteRule);
router.patch('/permissions', auth, requireRole('ADMIN'), updatePermissions);
router.post('/list/:listName', auth, requireRole('ADMIN'), addToList);
router.post('/products', auth, requireRole('ADMIN'), addProduct);

export default router;
