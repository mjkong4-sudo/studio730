# Studio 730 - Project Tracker

A web application for tracking Studio 730 Thursday 7:30 gatherings, where members can log their activities and leave comments.

## Features

- ✅ **Email verification (magic links)** - No passwords needed! Just enter your email and click the link sent to your inbox
- ✅ User profile management (nickname, first/last name, city, country, bio)
- ✅ Create records with date, city, and activity description
- ✅ View all records in a dashboard
- ✅ Comment on records
- ✅ Modern, responsive UI

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd studio730-app
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Set up environment variables:
The `.env.local` file should already be created with:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

**Email Configuration**: You need to configure SMTP settings for email verification. See `EMAIL_SETUP.md` for details.

For quick testing, you can use Ethereal Email (free testing service):
- Visit https://ethereal.email/ to create a test account
- Add SMTP credentials to your `.env.local`

**Important**: Change `NEXTAUTH_SECRET` to a secure random string in production.

4. Generate Prisma Client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Sign up or log in by entering your email address - you'll receive a magic link!

## Usage

1. **Sign Up/Login**: Enter your email address. You'll receive a magic link via email (no password needed!)
2. **Click the Magic Link**: Check your email and click the link to sign in
3. **Set Profile**: Update your profile with nickname, name, location, and bio
4. **Create Records**: Add records of what you did during Studio 730 sessions
5. **View Dashboard**: See all records from all members
6. **Comment**: Leave comments on any record

## Project Structure

```
studio730-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── records/      # Record CRUD
│   │   ├── comments/     # Comment creation
│   │   └── profile/      # Profile management
│   ├── login/            # Login page (email only)
│   ├── signup/           # Sign up page (email only)
│   ├── verify-email/     # Email verification page
│   ├── create-record/    # Create record page
│   ├── profile/          # Profile page
│   └── page.tsx          # Dashboard (home page)
├── components/           # React components
├── lib/                  # Utilities (Prisma, Auth)
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Database

The application uses SQLite for development (can be easily switched to PostgreSQL for production).

To view the database:
```bash
npx prisma studio
```

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **NextAuth.js** - Authentication with email verification
- **Prisma** - Database ORM
- **SQLite** - Database
- **Tailwind CSS** - Styling
- **Nodemailer** - Email sending

## Production Deployment

Before deploying to production:

1. Change `NEXTAUTH_SECRET` to a secure random string
2. Update `NEXTAUTH_URL` to your production domain
3. Configure production SMTP settings (see `EMAIL_SETUP.md`)
4. Consider switching to PostgreSQL for the database
5. Set up proper environment variables in your hosting platform

## License

MIT
