# Push Code to GitHub

Your code is ready to push! Choose one of these methods:

## Option 1: GitHub CLI (Easiest)

If you have GitHub CLI installed:

```bash
cd "/Users/minji2025/studio 730/studio730-app"
gh auth login
git push -u origin main
```

## Option 2: Use SSH (Recommended for frequent pushes)

1. **Switch to SSH remote:**
```bash
cd "/Users/minji2025/studio 730/studio730-app"
git remote set-url origin git@github.com:mjkong4-sudo/studio730.git
```

2. **Push:**
```bash
git push -u origin main
```

If you don't have SSH keys set up, GitHub will guide you through it.

## Option 3: Personal Access Token

1. **Create a token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name it: "Studio 730 Deployment"
   - Select scopes: `repo` (full control)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push using token:**
```bash
cd "/Users/minji2025/studio 730/studio730-app"
git push https://YOUR_TOKEN@github.com/mjkong4-sudo/studio730.git main
```

Replace `YOUR_TOKEN` with the token you copied.

## Option 4: Manual Push via GitHub Desktop

1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. Add your local repository
4. Click "Push origin"

## After Pushing

Once your code is on GitHub, proceed to deploy on Vercel:

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Import your repository: `mjkong4-sudo/studio730`
4. Follow the deployment steps in `NEXT_STEPS.md`
