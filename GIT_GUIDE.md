# Git Workflow Guide

## 📤 Pushing to GitHub

### First Time Setup (if not already done)
```bash
git remote add origin https://github.com/YOUR_USERNAME/haruDigitalWardrobe.git
```

### Regular Workflow

1. **Check Status**
```bash
git status
```

2. **Add Files**
```bash
# Add all files
git add .

# Or add specific files
git add backend/routes/designs.js
git add frontend/src/pages/MyDesigns.js
```

3. **Commit Changes**
```bash
git commit -m "feat: Add secure design upload with encryption and stylist assignment"
```

4. **Push to GitHub**
```bash
git push origin main
```

## 🔄 Cloning and Setting Up

### For Someone Cloning Your Repo

1. **Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/haruDigitalWardrobe.git
cd haruDigitalWardrobe
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, email credentials, etc.
node seedStylists.js  # Create demo stylist accounts
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

4. **Run Application**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📋 Commit Message Conventions

Use conventional commits for better changelog:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Examples:
```bash
git commit -m "feat: Add outfit stylist assignment system"
git commit -m "fix: Resolve stylist assignment parameter error"
git commit -m "docs: Update README with setup instructions"
```

## 🔐 Important Files to NEVER Commit

These are already in `.gitignore`:
- `.env` files (contains secrets!)
- `node_modules/` directories
- `uploads/` directory (encrypted files)
- Log files

## ✅ Safe to Commit

- `.env.example` (template without secrets)
- All source code files
- `package.json` and `package-lock.json`
- README and documentation
- Seed scripts (`seedStylists.js`)

## 🚨 Before Pushing

**Checklist:**
- [ ] `.env` file is NOT being committed
- [ ] No sensitive data (passwords, API keys) in code
- [ ] `node_modules/` is not included
- [ ] Code is tested and working
- [ ] README is up to date

## 🔄 Pulling Latest Changes

```bash
# Pull latest changes from GitHub
git pull origin main

# If you have local changes
git stash           # Save local changes
git pull origin main
git stash pop       # Restore local changes
```

## 🌿 Working with Branches

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Merge branch
git checkout main
git merge feature/new-feature

# Push branch to GitHub
git push origin feature/new-feature
```

## 📊 Useful Git Commands

```bash
# View commit history
git log --oneline

# View changes
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git restore filename.js

# Remove file from staging
git restore --staged filename.js
```
