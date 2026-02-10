# How to Get DATABASE_URL Value (Manual Entry)

Since there's no dropdown, you need to manually copy the database connection string.

## Step 1: Get the Database Connection String

### Option A: From Vercel Storage Tab

1. Go to your Vercel project
2. Click on the **"Storage"** tab
3. Click on your **Postgres database** (or create one if you haven't)
4. Look for a section called **"Connect"** or **"Connection String"**
5. You should see:
   - `POSTGRES_URL` - Direct connection
   - `POSTGRES_PRISMA_URL` - Prisma-formatted connection ✅ **Use this one!**
6. Click the **copy icon** next to `POSTGRES_PRISMA_URL`
7. This is your `DATABASE_URL` value

### Option B: From Environment Variables (If Already Created)

1. Go to **Settings** → **Environment Variables**
2. Look for `POSTGRES_PRISMA_URL` (Vercel might have auto-created it)
3. Click on it to see the value
4. Copy that value

### Option C: From Database Settings

1. Go to **Storage** → Your database
2. Click **"Settings"** or **"..."** menu
3. Look for **"Connection String"** or **"Connection Info"**
4. Copy the Prisma-formatted URL

## Step 2: Add DATABASE_URL Variable

1. **Key**: Type `DATABASE_URL`
2. **Value**: Paste the connection string you copied
   - It should look something like:
   ```
   postgres://user:password@host:5432/database?schema=public&pgbouncer=true&connect_timeout=15
   ```
3. **Environments**: Select all three:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Sensitive**: Turn ON (toggle switch)
5. Click **"Save"**

## What the Connection String Looks Like

The `POSTGRES_PRISMA_URL` typically looks like:
```
postgres://default:password@host.region.aws.neon.tech:5432/verceldb?sslmode=require&pgbouncer=true&connect_timeout=15
```

Or:
```
postgres://user:pass@host:5432/dbname?schema=public&pgbouncer=true&connect_timeout=15
```

**Important**: Make sure it includes `pgbouncer=true` - this is important for Vercel!

## If You Haven't Created the Database Yet

1. Go to **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Name it (e.g., `studio730-db`)
5. Choose a region
6. Click **"Create"**
7. Wait for it to be created
8. Then go back and get the connection string

## Troubleshooting

**Can't find the connection string?**
- Make sure the database is fully created (wait a minute)
- Check the **"Connect"** tab in the database settings
- Look for **"Connection String"** or **"Connection Info"**

**Still can't find it?**
- Try refreshing the page
- The connection string might be in a different tab (Settings, Connect, Overview)

**Database not created yet?**
- Go to Storage → Create Database → Postgres
- Wait for creation to complete
- Then get the connection string
