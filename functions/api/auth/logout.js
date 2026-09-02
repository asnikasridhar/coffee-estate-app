import { json, options, userIdFromRequest } from '../../_shared/http.js';
export function onRequestOptions(){return options()}
export async function onRequestPost({request,env}){
  try{
    await userIdFromRequest(request,env);
    const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/,'').trim();
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
    const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    await env.DB.prepare('UPDATE auth_session SET revoked_on=CURRENT_TIMESTAMP WHERE token_hash=?').bind(hash).run();
    return json({ok:true});
  }catch{return json({error:'Authentication required'},401)}
}
