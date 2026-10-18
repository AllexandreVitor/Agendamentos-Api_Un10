import express from 'express';
import { pool } from './database/pool';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { cors } from './middlewares/cors';
import { appointmentRoutes } from './routes/appointment.routes';
import { swaggerRoutes } from './docs/swagger';

export const app = express();

app.disable('x-powered-by');
app.use(cors);
app.use(express.json({ limit: '100kb' }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'error', database: 'down' });
  }
});

app.use('/api-docs', swaggerRoutes);
app.get('/docs', (_req, res) => res.redirect('/api-docs'));

app.use('/appointments', appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
