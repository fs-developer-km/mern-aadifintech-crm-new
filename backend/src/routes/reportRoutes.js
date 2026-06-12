import express from 'express';
import auth from '../middleware/auth.js';
import { getMisReport, exportLeadsCsv } from '../controllers/reportController.js';

const router = express.Router();

router.use(auth);
router.get('/mis', getMisReport);
router.get('/export/leads', exportLeadsCsv);

export default router;
