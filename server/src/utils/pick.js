export const pick = (obj, allowed) => Object.fromEntries(Object.entries(obj || {}).filter(([key]) => allowed.includes(key)));
export const money = expr => `ROUND(COALESCE(${expr},0),2)`;
