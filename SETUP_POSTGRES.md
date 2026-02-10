# PostgreSQL Database Setup Guide

## ✅ Step 1: Schema Updated

The Prisma schema has been updated to use PostgreSQL. You're all set!

**File**: `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 📋 Step 2: Create PostgreSQL Database on Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: **studio730-app**

2. **Create Database**
   - Click on **Storage** tab (left sidebar)
   - Click **Create Database** button
   - Select **Postgres**
   - Name: `studio730-db` (or any name you prefer)
   - Click **Create**
   - Wait 1-2 minutes for provisioning

3. **Configure Environment Variable**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Key: `DATABASE_URL`
   - Value: Click dropdown → Select `POSTGRES_PRISMA_URL`
   - Environments: Select all (Production, Preview, Development)
   - Sensitive: ✅ Enable
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments**
   - Click **⋯** on latest deployment
   - Select **Redeploy**

---

### Option B: Via Vercel CLI (If Available)

```bash
# Make sure you're logged in
npx vercel login

# Navigate to project directory
cd "/Users/minji2025/studio 730/studio730-app"

# Run the setup script
./setup-postgres-database.sh

# Or manually create database (if CLI supports it)
npx vercel storage create postgres studio730-db
```

---

## 🚀 Step 3: Run Migrations

After the database is created and `DATABASE_URL` is configured:

```bash
# Navigate to project
cd "/Users/minji2025/studio 730/studio730-app"

# Run migrations (for production)
npx prisma migrate deploy

# Or for development (if you have local PostgreSQL)
npx prisma migrate dev --name init_with_improvements

# Generate Prisma Client
npx prisma generate
```

---

## 🔍 Step 4: Verify Setup

### Check Database Connection

```bash
# Test connection
npx prisma db pull

# View database in Prisma Studio
npx prisma studio
```

### Verify Environment Variables

Make sure these are set in Vercel:
- ✅ `DATABASE_URL` → Points to `POSTGRES_PRISMA_URL`
- ✅ `NEXTAUTH_URL` → Your Vercel deployment URL
- ✅ `NEXTAUTH_SECRET` → Your secret key

---

## 📝 Important Notes

### Development vs Production

- **Development**: You can continue using SQLite locally (`file:./dev.db`)
- **Production**: Must use PostgreSQL on Vercel

### Switching Between Databases

If you want to use PostgreSQL locally too:

1. Create a `.env.local` file:
   ```bash
   DATABASE_URL="your-postgres-connection-string"
   ```

2. Or use Vercel's development database:
   ```bash
   # Pull environment variables from Vercel
   npx vercel env pull .env.local
   ```

### Schema Differences

The schema is now configured for PostgreSQL, which supports:
- ✅ All the indexes we added
- ✅ All the relationships
- ✅ All the new models (Reaction, Notification, Report)

---

## 🆘 Troubleshooting

### "POSTGRES_PRISMA_URL not found in dropdown"

**Solution:**
1. Make sure database is fully provisioned (check Storage tab)
2. Refresh the Environment Variables page
3. If still not showing, manually copy the connection string from Storage → Database → Connect

### "Migration failed"

**Solution:**
```bash
# Reset and start fresh (⚠️ deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name init_with_improvements
```

### "Connection refused" or "Database not found"

**Solution:**
1. Verify database is created and running in Vercel Storage
2. Check `DATABASE_URL` environment variable is set correctly
3. Make sure you're using `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)

---

## ✅ Checklist

- [ ] Schema updated to PostgreSQL ✅ (Done)
- [ ] Database created on Vercel
- [ ] `DATABASE_URL` environment variable configured
- [ ] Migrations run successfully
- [ ] Prisma Client generated
- [ ] Application redeployed
- [ ] Database connection verified

---

## 🎉 Next Steps

Once the database is set up:

1. **Test locally** (optional):
   ```bash
   npx prisma studio
   ```

2. **Deploy to production**:
   - Push your changes to GitHub
   - Vercel will automatically deploy
   - Or manually redeploy from dashboard

3. **Verify in production**:
   - Check that the app loads correctly
   - Test creating a record
   - Check that all features work

---

**Need Help?** Check the main documentation: `HOW_TO_ADD_ENV_VARS.md`
