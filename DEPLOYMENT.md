# Deployment Guide for Studio 730

This guide will help you deploy Studio 730 to production.

## 🚀 Quick Start: Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications. It's free for personal projects and handles everything automatically.

### Step 1: Prepare Your Code

1. **Create a GitHub repository** (if you haven't already):
   ```bash
   cd studio730-app
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   - Create a new repository on GitHub
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/studio730-app.git
   git push -u origin main
   ```

### Step 2: Set Up Production Database

SQLite won't work in production. You need a PostgreSQL database.

**Option A: Vercel Postgres (Easiest)**
- When deploying on Vercel, you can add a Postgres database directly in the Vercel dashboard
- It will automatically provide a `POSTGRES_PRISMA_URL` environment variable

**Option B: Other Database Providers**
- **Railway**: https://railway.app (Free tier available)
- **Supabase**: https://supabase.com (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **PlanetScale**: https://planetscale.com (Free tier available)

### Step 3: Update Prisma Schema for Production

You'll need to update your `prisma/schema.prisma` to support PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate dev --name production_setup
```

### Step 4: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with your GitHub account
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure Environment Variables**:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate a secure random string:
     ```bash
     openssl rand -base64 32
     ```
6. **Click "Deploy"**

Vercel will automatically:
- Build your Next.js app
- Run Prisma migrations
- Deploy to production

### Step 5: Run Database Migrations

After deployment, you need to run migrations:

```bash
# In Vercel dashboard, go to your project → Settings → Environment Variables
# Add your DATABASE_URL, then run:
npx prisma migrate deploy
```

Or use Vercel's CLI:
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## 🔧 Environment Variables Checklist

Make sure these are set in your production environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_URL` | Your production URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | Generate with `openssl rand -base64 32` |

## 📋 Pre-Deployment Checklist

- [ ] Code is pushed to GitHub
- [ ] Database provider is set up (PostgreSQL)
- [ ] Prisma schema updated for PostgreSQL
- [ ] Environment variables configured
- [ ] `NEXTAUTH_SECRET` is a secure random string
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] Database migrations are ready

## 🛠️ Alternative Deployment Options

### Railway

1. Go to https://railway.app
2. Create a new project
3. Add PostgreSQL database
4. Connect your GitHub repo
5. Set environment variables
6. Deploy!

### Render

1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repo
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

### Netlify

1. Go to https://netlify.com
2. Connect your GitHub repo
3. Note: Netlify requires additional configuration for Next.js API routes
4. Consider using Vercel for easier Next.js deployment

## 🔐 Security Checklist

- [ ] `NEXTAUTH_SECRET` is set and secure
- [ ] Database credentials are secure
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] No sensitive data in code
- [ ] HTTPS is enabled (automatic on Vercel)

## 📝 Post-Deployment

1. **Test your application**:
   - Sign up with a test email
   - Create a record
   - Add a comment
   - Edit a record

2. **Monitor your application**:
   - Check Vercel dashboard for errors
   - Monitor database connections
   - Check logs for any issues

3. **Set up custom domain** (optional):
   - In Vercel dashboard → Settings → Domains
   - Add your custom domain
   - Update `NEXTAUTH_URL` to match

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### NextAuth Errors
- Verify `NEXTAUTH_URL` matches your production URL exactly
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Prisma client is generated

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
