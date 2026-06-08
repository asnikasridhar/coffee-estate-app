export const today = () => new Date().toISOString().slice(0, 10);

const toDate = value => new Date(String(value || today()).slice(0, 10) + 'T00:00:00Z');
const isoDate = d => d.toISOString().slice(0, 10);

export function oneYearAgo() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return isoDate(d);
}

export function clampRange(fromValue, toValue) {
  let to = toDate(toValue || today());
  let from = toDate(fromValue || oneYearAgo());
  if (from > to) [from, to] = [to, from];

  const maxFrom = new Date(to);
  maxFrom.setUTCFullYear(maxFrom.getUTCFullYear() - 1);
  if (from < maxFrom) from = maxFrom;

  return { from: isoDate(from), to: isoDate(to) };
}

export const dateRange = req => clampRange(req.query.from, req.query.to);
export const dashboardRange = (req, key) => clampRange(req.query[`${key}From`] || req.query.from, req.query[`${key}To`] || req.query.to);
