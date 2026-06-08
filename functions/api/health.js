import { json, options } from '../_shared/http.js';
export async function onRequestOptions() { return options(); }
export async function onRequestGet() { return json({ ok: true, app: 'coffee-estate-api-d1' }); }
