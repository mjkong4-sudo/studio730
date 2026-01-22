# Email Configuration

The application now uses email verification (magic links) instead of passwords. You need to configure email settings in your `.env.local` file.

## Development Setup (Ethereal Email - Testing)

For development, you can use Ethereal Email (free testing service):

1. Visit https://ethereal.email/
2. Create a test account
3. Add these to your `.env.local`:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username
SMTP_PASSWORD=your-ethereal-password
EMAIL_FROM=noreply@studio730.com
```

## Production Setup

For production, use a real email service. Here are some options:

### Option 1: Gmail (for small projects)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

Note: You'll need to generate an "App Password" in your Google Account settings.

### Option 2: SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Option 3: Resend (Recommended)
Resend is a modern email API. Install the Resend package:
```bash
npm install resend
```

Then update `lib/email.ts` to use Resend instead of nodemailer.

### Option 4: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
EMAIL_FROM=noreply@yourdomain.com
```

## Current Configuration

Make sure your `.env.local` includes:
- `NEXTAUTH_URL` - Your application URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` - A random secret string
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (usually 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `EMAIL_FROM` - Email address to send from

## Testing

1. Start the dev server: `npm run dev`
2. Go to `/login` or `/signup`
3. Enter your email address
4. Check your email (or Ethereal inbox) for the magic link
5. Click the link to sign in

