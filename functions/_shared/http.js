const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://coffee-estate-app.pages.dev',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-Property-Id'
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}
export function options() { return new Response(null, { status: 204, headers: corsHeaders }); }
export async function body(request) { try { return await request.json(); } catch { return {}; } }
export function urlOf(request) { return new URL(request.url); }
async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}
export async function userIdFromRequest(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) throw Object.assign(new Error('Authentication required'), { status: 401 });
  const tokenHash = await sha256(token);
  const session = await env.DB.prepare(`SELECT s.auth_session_id, s.user_id, u.role
    FROM auth_session s JOIN users u ON u.user_id=s.user_id
    WHERE s.token_hash=? AND s.revoked_on IS NULL AND datetime(s.expires_on)>datetime('now')
      AND COALESCE(u.is_active,1)=1`).bind(tokenHash).first();
  if (!session) throw Object.assign(new Error('Session is invalid or expired'), { status: 401 });
  await env.DB.prepare('UPDATE auth_session SET last_used_on=CURRENT_TIMESTAMP WHERE auth_session_id=?').bind(session.auth_session_id).run();
  return Number(session.user_id);
}
export function propertyIdFromUrl(request) {
  const url = urlOf(request);
  const v = request.headers.get('X-Property-Id') || url.searchParams.get('property_id') || url.searchParams.get('propertyId');
  return v ? Number(v) : 0;
}
export function dateRange(request, prefix = '') {
  const url = urlOf(request);
  const today = new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get(`${prefix}from`) || url.searchParams.get(`${prefix}_from`) || url.searchParams.get('from') || '2025-01-01';
  const to = url.searchParams.get(`${prefix}to`) || url.searchParams.get(`${prefix}_to`) || url.searchParams.get('to') || today;
  return capOneYear(from, to);
}
export function dashboardRange(request, name) {
  const url = urlOf(request);
  const today = new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get(`${name}_from`) || url.searchParams.get(`${name}From`) || url.searchParams.get('from') || '2025-01-01';
  const to = url.searchParams.get(`${name}_to`) || url.searchParams.get(`${name}To`) || url.searchParams.get('to') || today;
  return capOneYear(from, to);
}
function capOneYear(from, to) {
  const f = new Date(from); const t = new Date(to);
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return { from: '2025-01-01', to: new Date().toISOString().slice(0, 10) };
  const max = new Date(f); max.setFullYear(max.getFullYear() + 1);
  const finalTo = t > max ? max : t;
  return { from: f.toISOString().slice(0,10), to: finalTo.toISOString().slice(0,10) };
}
export async function assertPropertyAccess(env, userId, propertyId) {
  if (!propertyId) return true;
  const p = await env.DB.prepare('SELECT property_id FROM property WHERE property_id = ? AND user_id = ?').bind(propertyId, userId).first();
  if (!p) throw new Error('Selected property does not belong to this owner');
  return true;
}
export async function all(env, sql, ...params) { const r = await env.DB.prepare(sql).bind(...params).all(); return r.results || []; }
export async function first(env, sql, ...params) { return await env.DB.prepare(sql).bind(...params).first(); }
export async function run(env, sql, ...params) { return await env.DB.prepare(sql).bind(...params).run(); }
export function fail(err, label = 'Request failed') {
  const details = err?.message || String(err);
  const status = Number(err?.status) || (/not found/i.test(details) ? 404 : /attendance|required|invalid|constraint|does not belong/i.test(details) ? 400 : 500);
  const safe = status >= 500 ? label : details;
  return json({ error: safe || label }, status);
}
export function requiredProperty(propertyId) { if (!propertyId) return json({ error: 'property_id required' }, 400); return null; }
