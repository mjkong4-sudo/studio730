# Environment Variable Correction

## ✅ Correct Configuration

**Key Name:** `DATABASE_URL`  
**Value:** Use the `POSTGRES_PRISMA_URL` connection string (from Vercel's dropdown)

## Why?

Your Prisma schema expects:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ← Looks for DATABASE_URL
}
```

## Quick Fix Steps

1. Go to Vercel → Settings → Environment Variables
2. Find `POSTGRES_PRISMA_URL` (or create new)
3. Change **Key** to: `DATABASE_URL`
4. Keep the **Value** as is (the Prisma connection pooling URL)
5. Save
6. Redeploy

## Value Format

The value should be a Prisma connection pooling URL:
```
postgres://[username]:[password]@db.prisma.io:5432/postgres?sslmode=require&pgbouncer=true&connect_timeout=15
```

This URL includes:
- ✅ Connection pooling (`pgbouncer=true`)
- ✅ SSL required (`sslmode=require`)
- ✅ Optimized for Prisma

## Summary

- **Key:** `DATABASE_URL` (not `POSTGRES_PRISMA_URL`)
- **Value:** The Prisma connection pooling URL (the value from `POSTGRES_PRISMA_URL`)
