# caption-ai-frontend

React + Vite frontend for CaptionAI. Deployed on Vercel.

## Features

- Drag-and-drop video/audio upload
- Live transcription progress
- View transcript and SRT captions side by side
- One-click copy or download (.txt / .srt)
- Recent jobs history (session)

## Local development

```bash
npm install

# Set your backend URL
cp .env.example .env
# Edit .env → VITE_API_URL=http://localhost:8000

npm run dev
# → http://localhost:5173
```

Make sure the backend is running locally on port 8000 first.

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted:
- Root directory: `.` (this repo root)
- Framework: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Add env var: `VITE_API_URL` = your Railway backend URL

### Option B — Vercel dashboard

1. https://vercel.com → **Add New Project**
2. Import this GitHub repo
3. Framework preset: **Vite** (auto-detected)
4. Environment variables → add:
   ```
   VITE_API_URL = https://your-backend.up.railway.app
   ```
5. Click **Deploy**

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Full URL of your Railway backend, no trailing slash |

## After deploying both

Once Vercel gives you your live URL (e.g. `https://caption-ai.vercel.app`), go to Railway and update:
```
ALLOWED_ORIGINS = https://caption-ai.vercel.app
```
This fixes CORS for production.
