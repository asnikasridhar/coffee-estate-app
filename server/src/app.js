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
import financeRoutes from './routes/finance.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import { log, requestLogger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);
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
  app.use('/api/finance', financeRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api', crudRoutes);

  app.use((err, req, res, _next) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    const message = err.message || 'Internal server error';
    const status = Number(err.status) || (/only a draft|duplicate|already/i.test(message) ? 409 : /invalid|select|belong|missing|required|must have attendance|constraint/i.test(message) ? 400 : 500);
    log(status >= 500 ? 'ERROR' : 'WARN', 'finance_api_failure', { request_id: req.requestId, path: req.path, status, error: message, ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: cleanStack(err.stack) } : {}) });
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : message });
  });

  return app;
}

function cleanStack(stack) { return String(stack).split('\n').slice(0, 8).join(' | ').slice(0, 1500); }
