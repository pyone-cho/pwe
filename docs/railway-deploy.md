# 🚂 Railway Deployment Guide

Deploy PWE (Organization Management System) on Railway for **free** using Railway's $5 monthly credit.

## Architecture

```
┌─────────────────────────────┐
│   Railway Project "pwe"     │
│                             │
│  ┌──────────┐   ┌────────┐ │
│  │ Frontend │──▶│ Backend│ │
│  │ Nginx:80 │   │ :3000  │ │
│  └──────────┘   └───┬────┘ │
│                     │      │
│              ┌──────▼─────┐│
│              │ PostgreSQL ││
│              └────────────┘│
└─────────────────────────────┘
```

- **Frontend**: React/Vite SPA served by Nginx, proxies `/api/*` to backend
- **Backend**: Express API on port 3000 with Prisma ORM
- **Database**: Railway PostgreSQL (free tier included in credits)

## Free Tier Budget ($5/month)

| Resource | Est. Cost/Hour | Est. Monthly |
|----------|---------------|-------------|
| Backend (512 MB) | ~$0.0036 | ~$2.60 |
| Frontend (256 MB) | ~$0.0018 | ~$1.30 |
| PostgreSQL (256 MB) | ~$0.001 | ~$0.72 |
| **Total** | **~$0.0064** | **~$4.62** |

> **Note**: Costs are estimates. Railway bills by the second and prices may change.
> The $5 free credit should cover a single instance of each service.

## Prerequisites

1. [Railway account](https://railway.app) (GitHub login)
2. Railway CLI (optional): `npm i -g @railway/cli`
3. Your PWE repo pushed to GitHub

## Step 1: Create the Project

### Option A: Via Dashboard (recommended)

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Empty Project"**
3. Name it `pwe` (or your preferred name)

### Option B: Via CLI

```bash
railway init
# Follow prompts to create a new project
```

## Step 2: Add PostgreSQL

1. In the Railway dashboard, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning (takes ~30s)
3. Click the PostgreSQL service → **"Variables"** tab
4. Copy the `DATABASE_URL` value (you'll need it for the backend)

## Step 3: Deploy the Backend

### Via Dashboard

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your PWE repo
3. Set **Root Directory** to `src/backend`
4. Railway auto-detects the `Dockerfile` and deploys
5. Go to **"Variables"** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | *(from Postgres service)* | Railway auto-injects this if you use the plugin reference |
| `JWT_SECRET` | *(generate below)* | **Required** |
| `REFRESH_TOKEN_SECRET` | *(generate below)* | **Required** |
| `JWT_EXPIRES_IN` | `15m` | |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` | |
| `NODE_ENV` | `production` | |
| `FRONTEND_URL` | `https://<frontend-domain>.railway.app` | Update after frontend deploy |
| `PORT` | `3000` | |

Generate secrets:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

6. Go to **Settings** → **Healthchecks** → set path to `/health`

### Via CLI

```bash
cd src/backend
railway service create backend
railway variable set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
railway variable set REFRESH_TOKEN_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
railway variable set JWT_EXPIRES_IN=15m REFRESH_TOKEN_EXPIRES_IN=7d NODE_ENV=production
railway variable set PORT=3000 FRONTEND_URL="https://<frontend-domain>.railway.app"
# Link PostgreSQL (add DATABASE_URL from plugin)
railway service link <postgres-service-id>
railway up
```

## Step 4: Deploy the Frontend

### Via Dashboard

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your PWE repo
3. Set **Root Directory** to `src/frontend`
4. Railway detects the `Dockerfile` and deploys
5. Go to **"Variables"** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `BACKEND_URL` | `http://<backend-service-name>:3000` | Railway internal URL |

The `BACKEND_URL` is the private URL of your backend service inside Railway's network.
You can find it: Backend service → **Settings** → **Private Networking**. It looks like:
`http://backend.upstash.internal:3000` or just `http://backend:3000`.

### Via CLI

```bash
cd src/frontend
railway service create frontend
railway variable set BACKEND_URL="http://backend:3000"
railway up
```

## Step 5: Set Up Railway Internal Networking

For the frontend to reach the backend:

1. Go to **Backend service** → **Settings** → **Private Networking** → note the private hostname
2. Go to **Frontend service** → **Variables** → set `BACKEND_URL = http://<backend-hostname>:3000`

Or use Railway's **Service Variables**:
1. Click the backend service
2. Go to **Variables** → click **"+ New Variable"** → **"Reference"**
3. Select **"Service Variable"** → choose your backend service
4. Add the reference as `INTERNAL_URL` or similar
5. In the frontend, set `BACKEND_URL` to the referenced value

> **Note**: Railway now also supports variable references — you can reference the backend's `PRIVATE_URL` directly in the frontend service.

## Step 6: Run Database Migrations

After the backend deploys, Railway runs the entrypoint which executes:
```
npx prisma generate && npx prisma migrate deploy && node dist/server.js
```

If migrations don't run automatically, trigger them manually:

### Via Railway Dashboard
1. Go to **Backend service** → **Connect** → **Railway CLI** → follow prompts
2. Run: `npx prisma migrate deploy`

### Via Railway CLI
```bash
railway shell
npx prisma generate
npx prisma migrate deploy
exit
```

## Environment Variables Summary

### Backend (`src/backend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (from Railway plugin) |
| `JWT_SECRET` | ✅ | Random 64-byte hex string |
| `REFRESH_TOKEN_SECRET` | ✅ | Random 64-byte hex string |
| `JWT_EXPIRES_IN` | Optional | Default: `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Optional | Default: `7d` |
| `PORT` | Optional | Default: `3000` |
| `NODE_ENV` | Optional | Set to `production` |
| `FRONTEND_URL` | ✅ | Public URL of the frontend (for CORS) |

### Frontend (`src/frontend/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | ✅ | Internal Railway URL of backend (e.g., `http://backend:3000`) |

## Custom Domain (Optional)

1. Go to **Frontend service** → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Follow Railway's DNS setup instructions
4. Update `FRONTEND_URL` in backend variables

## Troubleshooting

### Backend won't start
- Check logs: **Backend service** → **"Deployments"** → click the latest → **"View Logs"**
- Most common: missing `DATABASE_URL` or database hasn't finished provisioning
- Verify `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are set

### Prisma client errors
- Run `npx prisma generate` in a Railway shell
- Or add it to the deploy command

### CORS errors
- Ensure `FRONTEND_URL` in the backend matches the frontend's actual URL exactly
- Railway uses `https` — make sure the URL starts with `https://`

### API 502 Bad Gateway
- Frontend Nginx can't reach the backend
- Verify `BACKEND_URL` env var in the frontend service
- Check backend is running and healthy at `/health`

### SPA routes (e.g., /dashboard) return 404
- The Nginx config includes `try_files $uri $uri/ /index.html;`
- If this doesn't work, try a hard refresh or check browser console for errors

## Cleanup

To avoid charges (even with free credits):

1. **Stop services**: Select each service → **Settings** → scroll to **"Danger Zone"** → **"Stop Service"**
2. **Delete project**: Project settings → **"Delete Project"**
3. **Remove Railway CLI session**: `railway logout`
