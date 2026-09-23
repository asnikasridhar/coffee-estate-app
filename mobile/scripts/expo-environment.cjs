const { spawnSync } = require('node:child_process');
const urls = {
  dev: 'https://coffee-estate-app-dev.pages.dev/api',
  stg: 'https://coffee-estate-app-stg.pages.dev/api',
  prod: 'https://coffee-estate-app.pages.dev/api',
};
const [environment, ...args] = process.argv.slice(2);
if (!urls[environment]) {
  console.error('Usage: node scripts/expo-environment.cjs dev|stg|prod [Expo command and options]');
  process.exit(1);
}
console.log(`Expo ${environment.toUpperCase()}: ${urls[environment]}`);
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), ...(args.length ? args : ['start', '--clear'])], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_APP_ENV: environment, EXPO_PUBLIC_API_URL: urls[environment] },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
