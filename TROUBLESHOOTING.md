# Troubleshooting NextAuth Email Configuration Error

## Current Issue

You're seeing this error:
```
[next-auth][error][CLIENT_FETCH_ERROR] "There is a problem with the server configuration"
```

## Why This Happens

NextAuth's EmailProvider validates the SMTP server configuration during initialization. Even though we override `sendVerificationRequest` to use our custom email function, NextAuth still tries to validate the server config.

## Solutions

### Option 1: Configure SMTP (Recommended for Production)

Add real SMTP credentials to your `.env.local`:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-actual-username
SMTP_PASSWORD=your-actual-password
EMAIL_FROM=noreply@studio730.com
```

**For quick testing**, use Ethereal Email:
1. Visit https://ethereal.email/
2. Click "Create Ethereal Account"
3. Copy the SMTP credentials
4. Add them to `.env.local`
5. Restart the dev server

### Option 2: Ignore the Error (Development Only)

The error appears in the console but **doesn't prevent the app from working**. You can:

1. Enter your email on the login page
2. Click "Send Magic Link"
3. Check your **terminal/console** - the magic link will be logged there
4. Copy the link and paste it in your browser

The email verification flow works even with this error - it just logs to console instead of sending real emails.

### Option 3: Suppress Client-Side Error (Quick Fix)

The error is cosmetic and doesn't affect functionality. The app will work fine - you'll just see the error in the browser console.

## Testing the Flow

1. Go to `http://localhost:3000/login`
2. Enter any email address
3. Click "Send Magic Link"
4. Check your terminal - you'll see:
   ```
   ============================================================
   📧 MAGIC LINK (Development Mode)
   ============================================================
   Email: your@email.com
   Link: http://localhost:3000/api/auth/callback/email?...
   ============================================================
   ```
5. Copy the link and open it in your browser
6. You'll be signed in!

## Note

This error is a known limitation when using NextAuth's EmailProvider without proper SMTP configuration. The functionality works correctly - the error is just NextAuth's way of warning that email sending might not work (but we handle that with our custom function).

