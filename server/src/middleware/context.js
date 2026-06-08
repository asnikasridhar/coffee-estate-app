import { row } from '../db.js';

export function requestContext(req) {
  return {
    userId: Number(req.query.userId || req.header('x-user-id') || 0) || null,
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
