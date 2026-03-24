import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running successfully' });
});

export default router;
