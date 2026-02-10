# Environment Variables Setup Guide

> **Quick Start**  
> Add 3 required environment variables to your Vercel project.  
> **Estimated time**: 5-10 minutes

---

## Prerequisites

Before starting, ensure you have:

- [ ] Vercel account and project access
- [ ] Postgres database created (see [Database Setup](#database-setup) if needed)

---

## Overview

You'll configure **3 environment variables** for your Studio 730 application:

| Variable | Type | Environments | Sensitive |
|:---------|:-----|:-------------|:----------|
| `DATABASE_URL` | Database connection | All | Yes |
| `NEXTAUTH_URL` | Application URL | All | No |
| `NEXTAUTH_SECRET` | Auth encryption key | All | Yes |

---

## Step-by-Step Instructions

### Step 1: Access Environment Variables

Navigate to your Vercel project:

1. Open your project dashboard
2. Go to **Settings** → **Environment Variables**

---

### Step 2: Configure DATABASE_URL

> **Note**  
> If `POSTGRES_PRISMA_URL` isn't available in the dropdown, [create your database first](#database-setup).

**Configuration Details**

| Setting | Value |
|:-------|:-----|
| Key | `DATABASE_URL` |
| Value | Select `POSTGRES_PRISMA_URL` from dropdown |
| Environments | Production, Preview, Development |
| Sensitive | **Enabled** |

**Steps**

1. Click **Add New** or **Add Another**
2. Enter key: `DATABASE_URL`
3. In the value field:
   - Open the dropdown menu
   - Select `POSTGRES_PRISMA_URL`
   - *Alternative*: Use the link icon to connect your database
4. Select all environments:
   - Production
   - Preview
   - Development
5. Enable **Sensitive** toggle
6. Click **Save**

---

### Step 3: Configure NEXTAUTH_URL

**Configuration Details**

| Setting | Value |
|:-------|:-----|
| Key | `NEXTAUTH_URL` |
| Value | Your Vercel deployment URL |
| Environments | Production, Preview, Development |
| Sensitive | **Disabled** |

**Steps**

1. Click **Add Another**
2. Enter key: `NEXTAUTH_URL`
3. Enter your Vercel URL as the value:
   ```
   https://studio730-app.vercel.app
   ```
   > See [Finding Your NEXTAUTH_URL](#finding-your-nextauth-url) for help locating this.
4. Select all environments:
   - Production
   - Preview
   - Development
5. Leave **Sensitive** toggle disabled
6. Click **Save**

---

### Step 4: Configure NEXTAUTH_SECRET

> **Warning**  
> Copy the secret value exactly as shown. Include the trailing `=` character.

**Configuration Details**

| Setting | Value |
|:-------|:-----|
| Key | `NEXTAUTH_SECRET` |
| Value | `JCCSbf789u53QGCM9ys3LnLXn7Rm+ShLJlCTTVg3U4U=` |
| Environments | Production, Preview, Development |
| Sensitive | **Enabled** |

**Steps**

1. Click **Add Another**
2. Enter key: `NEXTAUTH_SECRET`
3. Paste this exact value:
   ```bash
   JCCSbf789u53QGCM9ys3LnLXn7Rm+ShLJlCTTVg3U4U=
   ```
   > **Tip**: Select the entire line including the `=` when copying
4. Select all environments:
   - Production
   - Preview
   - Development
5. Enable **Sensitive** toggle
6. Click **Save**

---

## Verification Checklist

Confirm your setup:

- [ ] `DATABASE_URL` configured with `POSTGRES_PRISMA_URL`
- [ ] `NEXTAUTH_URL` set to your Vercel deployment URL
- [ ] `NEXTAUTH_SECRET` added with exact value
- [ ] All variables enabled for Production, Preview, and Development
- [ ] Sensitive toggle enabled for `DATABASE_URL` and `NEXTAUTH_SECRET`
- [ ] Sensitive toggle disabled for `NEXTAUTH_URL`
- [ ] All variables saved (visible in Environment Variables list)
- [ ] Project redeployed (see [Redeployment](#redeployment))

---

## Redeployment

> **Important**  
> Environment variables only apply to new deployments. Redeploy your project after adding variables.

**Option 1: Redeploy Existing Deployment**

1. Navigate to **Deployments**
2. Locate the failed or latest deployment
3. Open the menu (⋯)
4. Select **Redeploy**

**Option 2: Trigger New Deployment**

- Push a new commit to your repository, or
- Click **Redeploy** on your latest deployment

---

## Reference

### Database Setup

If `POSTGRES_PRISMA_URL` isn't available:

1. Go to **Storage** in Vercel
2. Click **Create Database**
3. Select **Postgres**
4. Name your database (e.g., `studio730-db`)
5. Click **Create**
6. Wait for provisioning to complete
7. Return to **Environment Variables**
8. `POSTGRES_PRISMA_URL` will now appear in the dropdown

### Finding Your NEXTAUTH_URL

Your `NEXTAUTH_URL` is your Vercel deployment URL. Locate it using:

**Method 1: Settings**
- **Settings** → **Domains** → Copy production domain

**Method 2: Deployments**
- **Deployments** → Open latest deployment → Copy URL from details

**Method 3: Project Dashboard**
- URL displayed at the top of your project overview

**Format**: Always use `https://` prefix  
**Example**: `https://your-project-name.vercel.app`

---

## Troubleshooting

### POSTGRES_PRISMA_URL not available

**Solution**
- Create the database first (see [Database Setup](#database-setup))
- Refresh the page if database exists but dropdown is empty
- **Alternative**: Manually enter connection string from **Storage** → **Database** → **Connect**

---

### Value field dropdown missing

**Solution**
- Enter the full connection string manually
- Retrieve from: **Storage** → **Database** → **Connect** → Copy connection string
- Paste complete connection string into the Value field

---

### Unable to save variable

**Solution**
- Ensure at least one environment is selected (Production, Preview, or Development)
- Verify Key and Value fields are not empty
- Refresh the page and try again

---

### Build errors persist

**Solution**

1. Verify all 3 variables are saved (check Environment Variables list)
2. Confirm variables are enabled for **Production** environment
3. Ensure **Save** was clicked for each variable
4. **Redeploy** your project (variables don't apply to existing deployments)
5. Review build logs for specific error messages
6. Verify exact variable names:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`

---

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- Review build logs in **Deployments** for detailed error messages
- Verify database connectivity and connection string validity

---

**Last Updated**: February 2026
