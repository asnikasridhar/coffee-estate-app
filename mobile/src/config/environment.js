export const API_ENVIRONMENTS = {
  dev: { apiBase: 'https://coffee-estate-app-dev.pages.dev/api', watermark: 'DEV' },
  stg: { apiBase: 'https://coffee-estate-app-stg.pages.dev/api', watermark: 'STG' },
  prod: { apiBase: 'https://coffee-estate-app.pages.dev/api', watermark: '' },
};

export function resolveEnvironment(name = 'dev', override) {
  const key = (name || 'dev').toLowerCase();
  if (!API_ENVIRONMENTS[key]) throw new Error('EXPO_PUBLIC_APP_ENV must be dev, stg or prod');
  const apiBase = (override || API_ENVIRONMENTS[key].apiBase).trim().replace(/\/+$/, '');
  // Identify the actual target, including when a URL override is supplied.
  const target = Object.keys(API_ENVIRONMENTS).find(k => API_ENVIRONMENTS[k].apiBase === apiBase);
  const environment = target || 'dev';
  return { environment, apiBase, watermark: API_ENVIRONMENTS[environment].watermark };
}

// Expo statically inlines these literal EXPO_PUBLIC_* references into the bundle.
export const APP_ENVIRONMENT = resolveEnvironment(
  process.env.EXPO_PUBLIC_APP_ENV,
  process.env.EXPO_PUBLIC_API_URL,
);
