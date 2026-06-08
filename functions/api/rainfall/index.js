import { json, options, body, propertyIdFromUrl, dateRange } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try { const propertyId=propertyIdFromUrl(request); const {from,to}=dateRange(new URL(request.url)); const r=await env.DB.prepare(`SELECT r.rain_id,date(r.date_time) recorded_date,r.rain_amount rain_value,'mm' baseunit_name,p.property_name,b.block_name FROM raindetails r JOIN blocks b ON b.block_id=r.block_id JOIN property p ON p.property_id=b.property_id WHERE p.property_id=? AND date(r.date_time) BETWEEN date(?) AND date(?) ORDER BY r.date_time DESC,r.rain_id DESC`).bind(propertyId,from,to).all(); return json(r.results||[]); }
  catch(err){return json({error:'Rainfall load failed',details:err.message},500)}
}
export async function onRequestPost({ request, env }) {
  try { const b=await body(request); const rs=await env.DB.prepare(`INSERT INTO raindetails (block_id,rain_amount,date_time,created_by,created_on) VALUES (?,?,?,?,CURRENT_TIMESTAMP)`).bind(Number(b.block_id),Number(b.rain_value??b.rain_amount??0),b.recorded_date||b.date_time,b.created_by||'Cloudflare').run(); return json({rain_id:rs.meta.last_row_id,...b},201); }
  catch(err){return json({error:'Rainfall save failed',details:err.message},500)}
}
