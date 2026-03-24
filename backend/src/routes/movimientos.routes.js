import { Router } from 'express';
import { createMovimiento } from '../controllers/movimientos.controller.js';
import { validateMovimiento } from '../middlewares/validator.js';

const router = Router();

// POST /api/movimientos — CU02: Registrar Movimiento Manual
router.post('/', validateMovimiento, createMovimiento);

export default router;
