# Quick Database Setup Instructions

## ✅ Step 1: COMPLETED
Schema has been updated to PostgreSQL ✅

## 📋 Step 2: Create Database (5 minutes)

Since Vercel CLI doesn't support creating databases directly, please follow these steps:

### Quick Steps:

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Click on your project: **studio730-app**

2. **Create Postgres Database**
   - Click **Storage** tab (in left sidebar)
   - Click **Create Database** button
   - Select **Postgres**
   - Name: `studio730-db`
   - Click **Create**
   - ⏳ Wait 1-2 minutes for provisioning

3. **Add Environment Variable**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Key: `DATABASE_URL`
   - Value: Click the dropdown → Select `POSTGRES_PRISMA_URL`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Sensitive: ✅ Enable
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments**
   - Click **⋯** on latest deployment
   - Click **Redeploy**

5. **Run Migrations** (after redeploy completes)
   ```bash
   cd "/Users/minji2025/studio 730/studio730-app"
   npx prisma migrate deploy
   ```

---

## 🎯 That's it!

Once you complete these steps, your PostgreSQL database will be set up and ready to use with all the improvements we made!

**Estimated time**: 5-10 minutes

---

## Need Help?

See detailed guide: `SETUP_POSTGRES.md`
