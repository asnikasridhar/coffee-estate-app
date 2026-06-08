import { json, options, body, propertyIdFromUrl, dateRange } from '../../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try { const propertyId=propertyIdFromUrl(request); const {from,to}=dateRange(new URL(request.url)); const r=await env.DB.prepare(`SELECT a.attendance_id,date(a.entry_date) entry_date,a.attendance_value,l.name labor_name,COALESCE(w.wage_fixed+w.wage_variable,0) wage,p.property_name,u.username user_name,ROUND(a.attendance_value*COALESCE(w.wage_fixed+w.wage_variable,0),2) labor_cost FROM attendance a JOIN labors l ON l.labor_id=a.labor_id LEFT JOIN wage w ON w.labor_id=l.labor_id JOIN property p ON p.property_id=a.property_id JOIN users u ON u.user_id=a.user_id WHERE a.property_id=? AND date(a.entry_date) BETWEEN date(?) AND date(?) ORDER BY a.entry_date DESC,a.attendance_id DESC`).bind(propertyId,from,to).all(); return json(r.results||[]); }
  catch(err){return json({error:'Attendance load failed',details:err.message},500)}
}
export async function onRequestPost({ request, env }) {
  try { const b=await body(request); const rs=await env.DB.prepare(`INSERT INTO attendance (labor_id,property_id,user_id,entry_date,created_by,attendance_value) VALUES (?,?,?,?,?,?)`).bind(Number(b.labor_id),Number(b.property_id),Number(b.user_id||1),b.entry_date,b.created_by||'Cloudflare',Number(b.attendance_value||0)).run(); return json({attendance_id:rs.meta.last_row_id,...b},201); }
  catch(err){return json({error:'Attendance save failed',details:err.message},500)}
}
