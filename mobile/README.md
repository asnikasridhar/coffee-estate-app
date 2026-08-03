# Coffee Estate Mobile App - Expo SDK 54

This mobile app talks to the existing Express backend in `../server`.

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
Use your laptop IP address in the mobile app API URL field, for example:

```text
http://192.168.1.5:8787
```

Keep laptop and phone on the same Wi-Fi.

If LAN does not connect:

```bash
npx expo start --tunnel
```
