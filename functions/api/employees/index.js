import { json, options, body } from '../../_shared/http.js';
export async function onRequestOptions(){return options();}
export async function onRequestGet({env}){const r=await env.DB.prepare(`SELECT labor_id,name,address,aadhar_card,phone FROM labors ORDER BY name`).all();return json(r.results||[])}
export async function onRequestPost({request,env}){try{const b=await body(request);const rs=await env.DB.prepare(`INSERT INTO labors (name,address,aadhar_card,phone,created_by) VALUES (?,?,?,?,?)`).bind(b.name,b.address||'',b.aadhar_card||'',b.phone||'',b.created_by||'Cloudflare').run();return json({labor_id:rs.meta.last_row_id,...b},201)}catch(e){return json({error:'Employee save failed',details:e.message},500)}}
