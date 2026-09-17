import { randomUUID } from 'node:crypto';

const clean = value => String(value ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 300);
export function log(level, event, fields = {}) {
  const entry = { timestamp: new Date().toISOString(), level, event, ...fields };
  if (entry.error) entry.error = clean(entry.error);
  const output = JSON.stringify(entry);
  if (level === 'ERROR') console.error(output);
  else if (level === 'WARN') console.warn(output);
  else console.log(output);
}

export function requestLogger(req, res, next) {
  const started = Date.now();
  const requestId = clean(req.get('x-request-id') || randomUUID());
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    if (!req.originalUrl.startsWith('/api/finance') && !/^\/api\/(expenseTypes|vendors)/.test(req.originalUrl)) return;
    const parts = req.originalUrl.split('?')[0].split('/').filter(Boolean);
    const resource = parts[1] === 'finance' ? parts[2] : parts[1];
    const recordId = parts[1] === 'finance' ? parts[3] : parts[2];
    const action = req.body?.action || ({ POST: 'create', PATCH: 'update', PUT: 'update', DELETE: 'delete', GET: recordId ? 'detail' : 'list' }[req.method] || req.method.toLowerCase());
    log(res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO', 'finance_api', {
      request_id: requestId,
      method: req.method,
      action,
      entity: resource,
      record_id: recordId ? clean(recordId) : undefined,
      property_id: clean(req.get('x-property-id') || req.query.propertyId || req.query.property_id || ''),
      season_id: clean(req.body?.season_id || req.query.seasonId || ''),
      status: res.statusCode,
      duration_ms: Date.now() - started,
    });
  });
  next();
}
