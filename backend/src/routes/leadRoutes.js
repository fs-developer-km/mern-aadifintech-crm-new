import express from 'express';
import { getLeads, getLead, createLead, updateLead, addNote, updateDocStatus, deleteLead, getDashboardStats } from '../controllers/leadController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);
router.get('/stats', getDashboardStats);
router.get('/', getLeads);
router.get('/:id', getLead);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.post('/:id/notes', addNote);
router.patch('/:id/docs/:index', updateDocStatus);
router.delete('/:id', deleteLead);

export default router;
