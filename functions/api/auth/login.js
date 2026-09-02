import { json, options, body, all } from '../../_shared/http.js';
export function onRequestOptions() { return options(); }
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
async function digest(value){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))}
async function hashPassword(password){
  const iterations=210000,salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const hash=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);
  return `pbkdf2$${iterations}$${hex(salt)}$${hex(hash)}`;
}
async function verifyPassword(stored,password){
  const parts=String(stored||'').split('$');
  if(parts.length===4&&parts[0]==='pbkdf2'){
    const iterations=Number(parts[1]); if(!Number.isInteger(iterations)||iterations<100000)return {ok:false,needsUpgrade:false};
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
    const salt=Uint8Array.from(parts[2].match(/.{1,2}/g)||[],x=>parseInt(x,16));
    return {ok:hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256))===parts[3],needsUpgrade:false};
  }
  // One-time transition for legacy plaintext rows. Successful login immediately
  // replaces the plaintext value; bcrypt-looking rows are never treated as plaintext.
  if(!String(stored||'').startsWith('$2'))return {ok:String(stored||'')===String(password),needsUpgrade:true};
  return {ok:false,needsUpgrade:false};
}
export async function onRequestPost({ request, env }) {
  try {
    const b = await body(request);
    const username = b.username || b.user_name || b.email;
    const password = b.password;
    if (!username || !password) return json({ error: 'Username and password required' }, 400);

    const ip=request.headers.get('CF-Connecting-IP')||'unknown';
    const attemptKey=await digest(`${ip}|${String(username).toLowerCase()}`);
    const attempt=await env.DB.prepare("SELECT failure_count,blocked_until FROM auth_login_attempt WHERE attempt_key=?").bind(attemptKey).first();
    if(attempt?.blocked_until&&new Date(attempt.blocked_until)>new Date())return json({error:'Too many login attempts. Try again later.'},429);
    const user = await env.DB.prepare(
      `SELECT user_id, username, email, role, password FROM users
       WHERE COALESCE(is_active,1) = 1 AND (lower(username)=lower(?) OR lower(COALESCE(email,''))=lower(?)) LIMIT 1`
    ).bind(username, username).first();
    if (!user) {
      const failures=Number(attempt?.failure_count||0)+1,blocked=failures>=5?new Date(Date.now()+15*60*1000).toISOString():null;
      await env.DB.prepare(`INSERT INTO auth_login_attempt(attempt_key,failure_count,first_failure_on,blocked_until,modified_on) VALUES(?,?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP)
        ON CONFLICT(attempt_key) DO UPDATE SET failure_count=?,blocked_until=?,modified_on=CURRENT_TIMESTAMP`).bind(attemptKey,failures,blocked,failures,blocked).run();
      return json({ error: 'Invalid login' }, 401);
    }
    const verification = await verifyPassword(user.password,password);
    if (!verification.ok) {
      const failures=Number(attempt?.failure_count||0)+1,blocked=failures>=5?new Date(Date.now()+15*60*1000).toISOString():null;
      await env.DB.prepare(`INSERT INTO auth_login_attempt(attempt_key,failure_count,first_failure_on,blocked_until,modified_on) VALUES(?,?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP)
        ON CONFLICT(attempt_key) DO UPDATE SET failure_count=?,blocked_until=?,modified_on=CURRENT_TIMESTAMP`).bind(attemptKey,failures,blocked,failures,blocked).run();
      return json({ error: 'Invalid login' }, 401);
    }
    if(verification.needsUpgrade){
      await env.DB.prepare('UPDATE users SET password=?,modified_on=CURRENT_TIMESTAMP,modified_by=? WHERE user_id=?').bind(await hashPassword(password),'Security upgrade',user.user_id).run();
    }
    await env.DB.prepare('DELETE FROM auth_login_attempt WHERE attempt_key=?').bind(attemptKey).run();
    const token=`${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-','');
    const tokenHash=await digest(token),expiresOn=new Date(Date.now()+8*60*60*1000).toISOString();
    await env.DB.prepare('INSERT INTO auth_session(user_id,token_hash,expires_on,user_agent) VALUES(?,?,?,?)').bind(user.user_id,tokenHash,expiresOn,String(request.headers.get('User-Agent')||'').slice(0,250)).run();
    const safeUser = { user_id: user.user_id, username: user.username, email: user.email, role: user.role };
    const properties = await all(env, `SELECT property_id, property_name, total_acre, address_1, address_2, pincode, user_id FROM property WHERE user_id = ? ORDER BY property_name`, user.user_id);
    return json({ token, expires_on:expiresOn, user: safeUser, properties });
  } catch (err) { return json({ error: 'Login failed' }, 500); }
}
