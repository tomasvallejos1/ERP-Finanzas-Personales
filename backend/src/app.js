import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Middlewares globales (Seguridad y parsing)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Inyección de rutas
app.use('/api/health', healthRoutes);

export default app;
