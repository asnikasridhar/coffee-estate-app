import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import metaRoutes from './routes/meta.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import rainfallRoutes from './routes/rainfall.routes.js';
import yieldRoutes from './routes/yield.routes.js';
import crudRoutes from './routes/crud.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (_, res) => {
    res.json({ ok: true, app: 'coffee-estate-api', architecture: 'modular-property-scoped' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/rainfall', rainfallRoutes);
  app.use('/api/yield', yieldRoutes);
  app.use('/api', crudRoutes);

  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    const message = err.message || 'Internal server error';
    const status = /invalid|select|belong|missing|required/i.test(message) ? 400 : 500;
    res.status(status).json({ error: message });
  });

  return app;
}
