# Fix Vercel Build Error: DATABASE_URL Not Found

## The Problem

Vercel build is failing with:
```
Error: Environment variable not found: DATABASE_URL
```

This happens because:
1. The build command was trying to run `prisma migrate deploy` which needs DATABASE_URL
2. Environment variables might not be set in Vercel yet

## Solution

### Step 1: Set Environment Variables in Vercel (IMPORTANT!)

**Before building**, you MUST set environment variables:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `$POSTGRES_PRISMA_URL` | Select from dropdown (from Storage) |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Your Vercel URL |
| `NEXTAUTH_SECRET` | `JCCSbf789u53QGCM9ys3LnLXn7Rm+ShLJlCTTVg3U4U=` | The secret we generated |

**Important**: Make sure to:
- Select **"Production"**, **"Preview"**, and **"Development"** for each variable
- Click **"Save"** after adding each variable

### Step 2: Updated Build Configuration

I've updated `vercel.json` to:
- ✅ Run `prisma generate` (doesn't need DATABASE_URL)
- ✅ Run `next build`
- ❌ Removed `prisma migrate deploy` from build (run separately)

### Step 3: Run Migrations After Deployment

After your first successful deployment, run migrations separately:

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link
vercel login
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's database console in the dashboard.

### Step 4: Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the failed deployment
3. Or trigger a new deployment by pushing to GitHub

## Why This Happens

- `prisma generate` - Only needs the schema file, doesn't connect to database ✅
- `prisma migrate deploy` - Needs DATABASE_URL to connect to database ❌
- `next build` - Needs DATABASE_URL if Prisma client tries to connect ❌

By separating migrations from the build, we ensure:
1. Build can succeed without database connection
2. Migrations run separately when DATABASE_URL is available
3. App works correctly after migrations are run

## Quick Checklist

- [ ] Environment variables set in Vercel (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
- [ ] Variables set for Production, Preview, and Development
- [ ] PostgreSQL database created in Vercel Storage
- [ ] Build command updated (already done)
- [ ] Redeploy the project
- [ ] Run migrations after successful deployment
