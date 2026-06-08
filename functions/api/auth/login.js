import { json, options, body } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestPost({ request, env }) {
  try {
    const b = await body(request);
    const username = b.username || b.user_name;
    const password = b.password;
    if (!username || !password) return json({ error: 'Username and password required' }, 400);
    const user = await env.DB.prepare(`SELECT user_id, username, role FROM users WHERE username = ? AND password = ? LIMIT 1`).bind(username, password).first();
    if (!user) return json({ error: 'Invalid login' }, 401);
    return json({ token: `demo-token-${user.user_id}`, user });
  } catch (err) { return json({ error: 'Login failed', details: err.message }, 500); }
}
