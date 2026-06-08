import { json, options, propertyIdFromUrl, dateRange } from '../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet({ request, env }) {
  try {
    const propertyId = propertyIdFromUrl(request); const { from, to } = dateRange(new URL(request.url));
    const attendance = await env.DB.prepare(`SELECT COUNT(*) entries, COALESCE(SUM(attendance_value),0) labor_days FROM attendance WHERE property_id=? AND date(entry_date) BETWEEN date(?) AND date(?)`).bind(propertyId, from, to).first();
    const laborCost = await env.DB.prepare(`SELECT COALESCE(SUM(a.attendance_value * COALESCE(w.wage_fixed + w.wage_variable,0)),0) total FROM attendance a LEFT JOIN wage w ON w.labor_id=a.labor_id WHERE a.property_id=? AND date(a.entry_date) BETWEEN date(?) AND date(?)`).bind(propertyId, from, to).first();
    const rainfall = await env.DB.prepare(`SELECT COALESCE(SUM(r.rain_amount),0) total, COUNT(*) entries FROM raindetails r JOIN blocks b ON b.block_id=r.block_id WHERE b.property_id=? AND date(r.date_time) BETWEEN date(?) AND date(?)`).bind(propertyId, from, to).first();
    const yieldTotal = await env.DB.prepare(`SELECT COALESCE(SUM(ys.yield_quantity),0) quantity, COUNT(*) entries FROM yield_settlement ys LEFT JOIN blocks b ON b.block_id=ys.block_id WHERE COALESCE(b.property_id, ?) = ? AND date(ys.yield_settlement_date) BETWEEN date(?) AND date(?)`).bind(propertyId, propertyId, from, to).first();
    const recentAttendance = await env.DB.prepare(`SELECT a.attendance_id, date(a.entry_date) entry_date, l.name labor_name, a.attendance_value, ROUND(a.attendance_value*COALESCE(w.wage_fixed+w.wage_variable,0),2) cost FROM attendance a JOIN labors l ON l.labor_id=a.labor_id LEFT JOIN wage w ON w.labor_id=l.labor_id WHERE a.property_id=? ORDER BY a.entry_date DESC,a.attendance_id DESC LIMIT 8`).bind(propertyId).all();
    return json({ from, to, attendance, laborCost, rainfall, yieldTotal, recentAttendance: recentAttendance.results||[] });
  } catch (err) { return json({ error: 'Dashboard failed', details: err.message }, 500); }
}
