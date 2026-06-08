export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  });
}

export function options() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  });
}

export async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

export function required(value, name) {
  if (value === undefined || value === null || value === '') throw new Error(`${name} required`);
  return value;
}

export function today() { return new Date().toISOString().slice(0, 10); }

export function dateRange(url) {
  const to = url.searchParams.get('to') || today();
  const from = url.searchParams.get('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
  const days = Math.ceil((new Date(to) - new Date(from)) / 86400000);
  if (days > 366) throw new Error('Date range cannot exceed 1 year');
  return { from, to };
}

export function propertyIdFromUrl(request) {
  const id = Number(new URL(request.url).searchParams.get('property_id'));
  if (!id) throw new Error('property_id required');
  return id;
}
