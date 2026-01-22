# Studio 730 - Deployment Instructions

## 🎯 Quick Deploy to Vercel (5 minutes)

### Step 1: Push to GitHub

```bash
cd studio730-app
git init
git add .
git commit -m "Initial commit - ready for deployment"
```

Create a new repository on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/studio730-app.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import your repository**
5. **Configure Project**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `prisma generate && prisma migrate deploy && next build`
   - Output Directory: `.next` (default)

### Step 3: Add PostgreSQL Database

1. In Vercel dashboard → Your Project → **Storage** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name (e.g., `studio730-db`)
5. Click **"Create"**

Vercel will automatically create:
- `POSTGRES_URL` - Direct connection
- `POSTGRES_PRISMA_URL` - Prisma-formatted connection (use this!)

### Step 4: Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `$POSTGRES_PRISMA_URL` | Use the variable from Vercel Storage |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Secure random string |

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `NEXTAUTH_SECRET`.

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://your-app.vercel.app`

### Step 6: Run Database Migrations

After the first deployment, you need to run migrations. You can do this via:

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel link  # Link to your project
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Vercel Dashboard**
- Go to your project → **Deployments**
- Click on the latest deployment → **Functions** tab
- Or use Vercel's built-in database console

**Option C: Direct Database Connection**
- Get your database connection string from Vercel Storage
- Connect using any PostgreSQL client
- Or use Prisma Studio: `npx prisma studio`

## 🔄 For Local Development (PostgreSQL)

If you want to use PostgreSQL locally too:

1. **Install PostgreSQL** or use a cloud service
2. **Update `.env.local`**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/studio730"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-local-secret"
   ```
3. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```

## 🔄 For Local Development (Keep SQLite)

If you prefer to keep SQLite for local dev:

1. **Create `prisma/schema.sqlite.prisma`** (copy of schema.prisma with `provider = "sqlite"`)
2. **Use different schema files** for dev vs production
3. Or **manually switch** the provider in `schema.prisma` when needed

**Recommended**: Use PostgreSQL for both dev and production for consistency.

## 📋 Environment Variables Reference

### Required for Production:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Secure random string

### Optional:
- `SMTP_HOST` - For email (if you add email verification later)
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `EMAIL_FROM` - From email address

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure `DATABASE_URL` is set correctly
- Verify Prisma client generates successfully

### Database Connection Errors
- Verify `DATABASE_URL` uses `POSTGRES_PRISMA_URL` format
- Check database is created in Vercel Storage
- Ensure migrations have run

### NextAuth Errors
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies

## ✅ Post-Deployment Checklist

- [ ] App loads at production URL
- [ ] Can sign up with email
- [ ] Can create profile
- [ ] Can create records
- [ ] Can add comments
- [ ] Can edit records/comments
- [ ] Database persists data
- [ ] HTTPS is enabled (automatic on Vercel)

## 🎉 You're Live!

Your Studio 730 app is now publicly accessible!

**Next Steps:**
- Share your URL with your Studio 730 community
- Monitor usage in Vercel dashboard
- Set up custom domain (optional)
- Add email verification (optional)
