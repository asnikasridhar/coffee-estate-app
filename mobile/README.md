# Coffee Estate Mobile App - Expo SDK 54

The mobile app defaults to DEV. Select the environment explicitly when starting Expo or building an Android app; changing Git branches alone does not change an already built app.

| Environment | Branch | API base | Login and signed-in label |
| --- | --- | --- | --- |
| DEV | develop-mobile | https://coffee-estate-app-dev.pages.dev/api | DEV |
| STG | stage-mobile | https://coffee-estate-app-stg.pages.dev/api | STG |
| Production | main | https://coffee-estate-app.pages.dev/api | None |

From the repository root, start Expo Go with one of:

```powershell
npm run start:dev --prefix mobile
npm run start:stg --prefix mobile
npm run start:prod --prefix mobile
```

Stop the previous Metro server before switching. Each command clears Metro's cache and sets both environment variables for that process, overriding stale shell URL settings. DEV/STG remembered login credentials are stored separately from production.

For native Android builds/runs:

```powershell
npm run android:dev --prefix mobile
npm run android:stg --prefix mobile
npm run android:prod --prefix mobile
```

Equivalent direct Expo commands (run from `mobile`):

```powershell
$env:EXPO_PUBLIC_APP_ENV='dev'
$env:EXPO_PUBLIC_API_URL='https://coffee-estate-app-dev.pages.dev/api'
npx expo start --clear
```

Use `stg` with `https://coffee-estate-app-stg.pages.dev/api`, or `prod` with `https://coffee-estate-app.pages.dev/api`. Environment values are bundled into the app; installed apps need a rebuild/update to switch.

For a local Express backend:

```powershell
$env:EXPO_PUBLIC_APP_ENV='dev'
$env:EXPO_PUBLIC_API_URL='http://YOUR-LAPTOP-IP:8787/api'
npx expo start --clear
```

The login screen does not ask users to configure a backend URL. Local/custom API overrides display DEV. Known hosted URLs determine their own label, so the watermark always matches the target API.

Live dashboard weather is currently hidden because the external API integration
is unavailable. The implementation remains in place for a later release. To
explicitly enable it, provide both the feature flag and a WeatherAPI key before
starting Expo:

```powershell
$env:EXPO_PUBLIC_ENABLE_WEATHER='true'
$env:EXPO_PUBLIC_WEATHER_API_KEY='YOUR_WEATHERAPI_KEY'
$env:EXPO_PUBLIC_WEATHER_LOCATION='bengaluru'
```

## Run backend

From the project root:

```bash
npm run install:all
npm run seed
npm run dev --prefix server
```

Backend runs on:

```text
http://localhost:8787
```

## Run mobile

Open another terminal:

```bash
cd mobile
npm install
npx expo start -c
```

Scan the QR code using Expo Go.

## Important for Android phone

`localhost` on your phone means the phone itself, not your laptop.
Set the environment override to your laptop IP address before starting Expo:

```text
$env:EXPO_PUBLIC_API_URL='http://192.168.1.5:8787/api'
```

Keep laptop and phone on the same Wi-Fi.

If LAN does not connect:

```bash
npx expo start --tunnel
```
