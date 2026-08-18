# Coffee Estate Mobile App - Expo SDK 54

This mobile app talks to the existing Express backend in `../server`.

The app uses the production Cloudflare Pages API by default:

```text
https://coffee-estate-app.pages.dev/api
```

For local development, override it before starting Expo:

```powershell
$env:EXPO_PUBLIC_API_URL='http://YOUR-LAPTOP-IP:8787/api'
npm start
```

The login screen does not ask users to configure a backend URL.

Live dashboard weather uses WeatherAPI. The included development key can be
overridden without editing the app:

```powershell
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
