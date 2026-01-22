# Quick Deployment Guide

## 🎯 Fastest Way: Vercel + Vercel Postgres

### 1. Push Code to GitHub
```bash
cd studio730-app
git init
git add .
git commit -m "Ready for deployment"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/studio730-app.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to https://vercel.com and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 3. Add Database
1. In Vercel dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. This automatically creates `POSTGRES_PRISMA_URL` and `POSTGRES_URL`

### 4. Update Prisma Schema
Before deploying, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 5. Set Environment Variables in Vercel
Go to Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Use `POSTGRES_PRISMA_URL` from Vercel Storage |
| `NEXTAUTH_URL` | Your Vercel URL (e.g., `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |

### 6. Deploy!
Click "Deploy" - Vercel will:
- Build your app
- Run Prisma migrations
- Deploy to production

### 7. Run Migrations
After first deployment, run:
```bash
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
npm i -g vercel
vercel env pull .env.local
npx prisma migrate deploy
```

## ✅ That's it!

Your app will be live at `https://your-app.vercel.app`

## 🔄 For Future Updates

Just push to GitHub - Vercel auto-deploys!

```bash
git add .
git commit -m "Update"
git push
```
