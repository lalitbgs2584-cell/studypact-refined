# StudyPact — Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Neon database already set up (you have this)
- Google OAuth app already set up (you have this)
- UploadThing account already set up (you have this)

---

## Step 1 — Push to GitHub

Make sure your `.env` file is NOT committed (it's in `.gitignore`).

```bash
git init                        # if not already a git repo
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/studypact.git
git push -u origin main
```

---

## Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select your repo
3. Framework preset will auto-detect as **Next.js** — leave it
4. **Do NOT deploy yet** — set env vars first (Step 3)

---

## Step 3 — Set Environment Variables in Vercel

In the Vercel project settings → **Environment Variables**, add ALL of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string (with `?sslmode=require`) |
| `BETTER_AUTH_SECRET` | Your secret (run `openssl rand -base64 32` to generate) |
| `BETTER_AUTH_URL` | `https://your-app.vercel.app` (your actual Vercel URL) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `UPLOADTHING_TOKEN` | From UploadThing dashboard |
| `CRON_SECRET` | Any random string (run `openssl rand -base64 32`) |
| *(no Pusher needed)* | Realtime uses built-in SSE — no external service required |

> Set all variables for **Production**, **Preview**, and **Development** environments.

---

## Step 4 — Fix Google OAuth Redirect URI

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth client:

Add to **Authorized redirect URIs**:
```
https://your-app.vercel.app/api/auth/callback/google
```

Also add your Vercel preview URL pattern if you want previews to work:
```
https://studypact-*.vercel.app/api/auth/callback/google
```

---

## Step 5 — Deploy

Click **Deploy** in Vercel. The build runs:
1. `npm install` → triggers `postinstall` → runs `prisma generate`
2. `next build` → compiles the app

Build should complete in ~2 minutes.

---

## Step 6 — Update BETTER_AUTH_URL

After your first deploy, Vercel gives you a URL like `studypact-abc123.vercel.app`.

Go back to **Environment Variables** and update:
```
BETTER_AUTH_URL=https://studypact-abc123.vercel.app
```

Then **Redeploy** (Deployments tab → three dots → Redeploy).

---

## Step 7 — Add a Custom Domain (optional)

Vercel dashboard → your project → **Settings → Domains** → add your domain.

Update `BETTER_AUTH_URL` and Google OAuth redirect URI to use the custom domain.

---

## Cron Job

The `/api/cron` route runs daily at 18:35 UTC (midnight IST) to mark overdue tasks as MISSED.

Vercel automatically calls it on the schedule in `vercel.json`. It's protected by the `CRON_SECRET` env var — Vercel sends it as a Bearer token automatically.

---

## Troubleshooting

**Build fails with "Cannot find module '@prisma/client'"**
→ Make sure `postinstall: prisma generate` is in `package.json` scripts. ✅ Already done.

**"BETTER_AUTH_URL must be set" error**
→ Add `BETTER_AUTH_URL` env var in Vercel with your production URL.

**Google login redirects to localhost**
→ Update `BETTER_AUTH_URL` in Vercel env vars to your production URL and redeploy.

**Images not loading from UploadThing**
→ `next.config.ts` already has `utfs.io` and `ufs.sh` in `remotePatterns`. ✅ Already done.

**Cron not running**
→ Vercel Cron is only available on Hobby plan and above. Check Vercel dashboard → your project → **Cron Jobs** tab.
