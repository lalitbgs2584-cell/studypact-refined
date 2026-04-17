# StudyPact

StudyPact is a Next.js app with:

- Better Auth
- Prisma + Neon Postgres
- UploadThing uploads
- Socket.IO on a custom Node server

This repo is set up to run on a regular Node server such as AWS EC2.

## Production Environment

Create a `.env` file with:

```env
NODE_ENV=production
PORT=3000
TZ=Asia/Kolkata
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
UPLOADTHING_TOKEN=your-uploadthing-token
```

## Build

```bash
pnpm install
pnpm build
```

`pnpm build` runs:

1. `prisma generate`
2. `next build`
3. `tsc --project tsconfig.server.json`

The custom server output is written to `.server-dist/server.js`.

## Start

```bash
pnpm start
```

Production startup uses `start-server.cjs`, which:

- forces `NODE_ENV=production`
- defaults `TZ` to `Asia/Kolkata` if it is not already set
- runs the compiled custom server from `.server-dist/server.js`

## EC2 Notes

- Use Node 20 LTS
- Put Nginx in front of the app
- Proxy both normal HTTP traffic and WebSocket traffic to port `3000`
- Keep `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` on the same public domain
- Add the Google OAuth callback:

```text
https://your-domain.com/api/auth/callback/google
```

## Realtime

Realtime is handled by the app's built-in Socket.IO server at `/api/socketio`.
No cron worker, Docker container, or third-party realtime service is required.

## Verification

Before deploying, run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
