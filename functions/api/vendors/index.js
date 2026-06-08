import { json, options, body } from '../../_shared/http.js';
export async function onRequestOptions(){return options();}
export async function onRequestGet({env}){const r=await env.DB.prepare(`SELECT vendor_id,vendor_name,phone,address,vendor_type FROM vendors ORDER BY vendor_name`).all();return json(r.results||[])}
export async function onRequestPost({request,env}){try{const b=await body(request);const rs=await env.DB.prepare(`INSERT INTO vendors (vendor_name,phone,address,vendor_type,created_by) VALUES (?,?,?,?,?)`).bind(b.vendor_name,b.phone||'',b.address||'',b.vendor_type||'General',b.created_by||'Cloudflare').run();return json({vendor_id:rs.meta.last_row_id,...b},201)}catch(e){return json({error:'Vendor save failed',details:e.message},500)}}
