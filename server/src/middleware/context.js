import { row, run } from '../db.js';
import { createHash } from 'node:crypto';

export function requestContext(req) {
  const token=String(req.header('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  const tokenHash=token?createHash('sha256').update(token).digest('hex'):'';
  const session=tokenHash?row(`SELECT s.auth_session_id,s.user_id FROM auth_session s JOIN users u ON u.user_id=s.user_id WHERE s.token_hash=? AND s.revoked_on IS NULL AND datetime(s.expires_on)>datetime('now') AND COALESCE(u.is_active,1)=1`,[tokenHash]):null;
  if(!session)throw Object.assign(new Error('Authentication required'),{status:401});
  run('UPDATE auth_session SET last_used_on=CURRENT_TIMESTAMP WHERE auth_session_id=?',[session.auth_session_id]);
  return {
    userId: Number(session.user_id),
    propertyId: Number(req.query.propertyId || req.header('x-property-id') || 0) || null
  };
}

export function requireOwner(userId) {
  const owner = row('SELECT user_id, username, email, role FROM users WHERE user_id = ? AND is_active = 1', [userId]);
  if (!owner) throw new Error('Invalid or inactive user');
  return owner;
}

export function assertPropertyAccess(userId, propertyId) {
  if (!propertyId) throw new Error('Select or create a property first');
  const property = row('SELECT property_id FROM property WHERE property_id = ? AND user_id = ?', [propertyId, userId]);
  if (!property) throw new Error('Selected property does not belong to this owner');
}

export function requireScopedProperty(req) {
  const { userId, propertyId } = requestContext(req);
  if (userId) requireOwner(userId);
  if (userId && propertyId) assertPropertyAccess(userId, propertyId);
  return { userId, propertyId };
}
