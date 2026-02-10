# Next Steps After Adding Prisma Postgres Database

## ✅ What You've Done
- Created Prisma Postgres database ✅

## 📋 Next Steps Checklist

### Step 1: Get the Connection String
1. On the Prisma Postgres page, go to **Quickstart** tab
2. Click on **".env.local"** tab
3. Click **"Show secret"** (eye icon) to reveal the URL
4. Copy **`PRISMA_DATABASE_URL`** (or `POSTGRES_URL` if that's what you see)
5. Click **"Copy Snippet"** button

### Step 2: Add to Vercel Environment Variables
1. Go to your **Vercel project** (not the database page)
2. Click **Settings** → **Environment Variables**
3. Click **"Add Another"** or the **+** button

**Add DATABASE_URL:**
- **Key**: `DATABASE_URL`
- **Value**: Paste the connection string you copied
- **Environments**: Select all three:
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- **Sensitive**: Turn **ON** (toggle switch)
- Click **"Save"**

**Add NEXTAUTH_URL:**
- Click **"Add Another"** again
- **Key**: `NEXTAUTH_URL`
- **Value**: Your Vercel URL (e.g., `https://studio730-app.vercel.app`)
  - Find it in: Project → Settings → Domains
- **Environments**: Select all three
- **Sensitive**: Leave **OFF**
- Click **"Save"**

**Add NEXTAUTH_SECRET:**
- Click **"Add Another"** again
- **Key**: `NEXTAUTH_SECRET`
- **Value**: `JCCSbf789u53QGCM9ys3LnLXn7Rm+ShLJlCTTVg3U4U=`
- **Environments**: Select all three
- **Sensitive**: Turn **ON**
- Click **"Save"**

### Step 3: Verify All Variables Are Set
You should have 3 environment variables:
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_URL`
- ✅ `NEXTAUTH_SECRET`

### Step 4: Redeploy Your Project
1. Go to **Deployments** tab
2. Find the failed deployment
3. Click **"Redeploy"** (or the three dots → Redeploy)
4. Wait for build to complete (~2-3 minutes)

### Step 5: Run Database Migrations
After successful deployment, run migrations:

```bash
cd "/Users/minji2025/studio 730/studio730-app"

# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's database console in the dashboard.

## 🎯 Quick Checklist

- [ ] Database created ✅
- [ ] Connection string copied from Quickstart → .env.local tab
- [ ] `DATABASE_URL` added to Environment Variables
- [ ] `NEXTAUTH_URL` added to Environment Variables
- [ ] `NEXTAUTH_SECRET` added to Environment Variables
- [ ] All variables set for Production, Preview, Development
- [ ] Redeployed the project
- [ ] Run migrations after deployment

## 🆘 Troubleshooting

**Can't find the connection string?**
- Go to Prisma Postgres page → Quickstart → .env.local tab
- Click "Show secret" to reveal it
- Copy `PRISMA_DATABASE_URL` or `POSTGRES_URL`

**Build still failing?**
- Make sure all 3 variables are added
- Check that variables are set for "Production" environment
- Verify you clicked "Save" for each variable
- Try redeploying again

**Need help?**
- Check that connection string is correct
- Verify all environment variables are set
- Make sure database is "Available" (green status)

## 🎉 You're Almost There!

Once you:
1. Add all 3 environment variables ✅
2. Redeploy ✅
3. Run migrations ✅

Your Studio 730 app will be live! 🚀
