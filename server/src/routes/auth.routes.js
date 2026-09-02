import { Router } from 'express';
import { z } from 'zod';
import { row, rows, run } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto';

const router = Router();

router.post('/login', asyncHandler((req, res) => {
  const { username, password } = z.object({ username: z.string().min(1), password: z.string().min(1) }).parse(req.body);
  const attemptKey=createHash('sha256').update(`${req.ip}|${username.toLowerCase()}`).digest('hex');
  const attempt=row('SELECT failure_count,blocked_until FROM auth_login_attempt WHERE attempt_key=?',[attemptKey]);
  if(attempt?.blocked_until&&new Date(attempt.blocked_until)>new Date())return res.status(429).json({error:'Too many login attempts. Try again later.'});
  const user = row(`SELECT user_id, username, email, role, password FROM users WHERE is_active = 1 AND (lower(username)=lower(@username) OR lower(email)=lower(@username))`, { username });
  const reject=()=>{const failures=Number(attempt?.failure_count||0)+1,blocked=failures>=5?new Date(Date.now()+15*60*1000).toISOString():null;run(`INSERT INTO auth_login_attempt(attempt_key,failure_count,first_failure_on,blocked_until,modified_on) VALUES(?,?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP) ON CONFLICT(attempt_key) DO UPDATE SET failure_count=?,blocked_until=?,modified_on=CURRENT_TIMESTAMP`,[attemptKey,failures,blocked,failures,blocked]);return res.status(401).json({error:'Invalid login'});};
  if (!user) return reject();

  const parts=String(user.password||'').split('$');
  const isPbkdf2=parts.length===4&&parts[0]==='pbkdf2'&&Number(parts[1])>=100000;
  const legacyPlaintext=!isPbkdf2&&!String(user.password||'').startsWith('$2');
  const ok=isPbkdf2?pbkdf2Sync(password,Buffer.from(parts[2],'hex'),Number(parts[1]),32,'sha256').toString('hex')===parts[3]:legacyPlaintext&&String(user.password||'')===password;
  if (!ok) return reject();
  if(legacyPlaintext){const iterations=100000,salt=randomBytes(16),hash=pbkdf2Sync(password,salt,iterations,32,'sha256');run('UPDATE users SET password=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE user_id=?',[`pbkdf2$${iterations}$${salt.toString('hex')}$${hash.toString('hex')}`,'Security upgrade',user.user_id]);}
  run('DELETE FROM auth_login_attempt WHERE attempt_key=?',[attemptKey]);

  const safeUser = { user_id: user.user_id, username: user.username, email: user.email, role: user.role };
  const properties = rows('SELECT property_id, property_name, total_acre, address_1, address_2, pincode FROM property WHERE user_id = ? ORDER BY property_name', [user.user_id]);
  const token=randomBytes(48).toString('hex'),tokenHash=createHash('sha256').update(token).digest('hex'),expiresOn=new Date(Date.now()+8*60*60*1000).toISOString();
  run('INSERT INTO auth_session(user_id,token_hash,expires_on,user_agent) VALUES(?,?,?,?)',[user.user_id,tokenHash,expiresOn,String(req.header('user-agent')||'').slice(0,250)]);
  res.json({ token,expires_on:expiresOn,user: safeUser, properties });
}));

router.post('/logout',asyncHandler((req,res)=>{
  const token=String(req.header('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(token)run('UPDATE auth_session SET revoked_on=CURRENT_TIMESTAMP WHERE token_hash=?',[createHash('sha256').update(token).digest('hex')]);
  res.json({ok:true});
}));

export default router;
