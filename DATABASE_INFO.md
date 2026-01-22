# Database Information

## Where Data is Stored

All data is stored in a **SQLite database file** located at:

```
/Users/minji2025/studio 730/studio730-app/prisma/dev.db
```

## Database Structure

The database contains the following tables:

1. **User** - User accounts and profiles
   - id, email, emailVerified
   - nickname, firstName, lastName, city, country, bio
   - createdAt, updatedAt

2. **Record** - Studio 730 activity records
   - id, date, city, content
   - userId (links to User)
   - createdAt, updatedAt

3. **Comment** - Comments on records
   - id, content
   - userId (links to User)
   - recordId (links to Record)
   - createdAt, updatedAt

4. **VerificationToken** - Email verification tokens (for future use)
   - id, identifier, token, expires
   - userId (links to User)

## Viewing Your Data

### Option 1: Prisma Studio (Recommended - Visual Interface)

```bash
cd studio730-app
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all tables
- Browse records
- Edit data
- See relationships between tables

### Option 2: SQLite Command Line

```bash
cd studio730-app
sqlite3 prisma/dev.db
```

Then run SQL queries:
```sql
.tables                    -- List all tables
SELECT * FROM User;        -- View all users
SELECT * FROM Record;      -- View all records
SELECT * FROM Comment;     -- View all comments
.quit                      -- Exit
```

### Option 3: Database Browser Tools

You can use any SQLite browser tool:
- **DB Browser for SQLite** (free, cross-platform)
- **TablePlus** (macOS, paid)
- **DBeaver** (free, cross-platform)

Just open the file: `prisma/dev.db`

## Backup Your Data

To backup your database:

```bash
cd studio730-app
cp prisma/dev.db prisma/dev.db.backup
```

Or create a timestamped backup:
```bash
cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
```

## Production Database

For production, you can easily switch to PostgreSQL or MySQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // or "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/studio730"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Current Database File

- **Location**: `studio730-app/prisma/dev.db`
- **Size**: Currently ~56KB (will grow as you add data)
- **Format**: SQLite 3

