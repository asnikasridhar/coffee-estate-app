import { json, options } from '../_shared/http.js';
export function onRequestOptions() { return options(); }
export async function onRequestGet() { return json({ ok: true, app: 'coffee-estate-api', runtime: 'cloudflare-pages-functions' }); }
