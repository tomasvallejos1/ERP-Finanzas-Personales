import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

// GET /api/dashboard — CU04: Visualizar Dashboard
router.get('/', getDashboard);

export default router;
