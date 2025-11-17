# 🚀 Quick Start Guide

Get your Orgo Monitor running in **5 minutes**!

## Step 1: Install Node.js (if not installed)

**Windows/Mac:**
- Download from: https://nodejs.org/
- Choose LTS version (recommended)
- Run installer and follow prompts

**Check installation:**
```bash
node --version   # Should show v14.0.0 or higher
npm --version    # Should show v6.0.0 or higher
```

## Step 2: Download the Project

```bash
# Clone repository
git clone https://github.com/yourusername/orgo-monitor.git

# Enter directory
cd orgo-monitor
```

Or download ZIP and extract it.

## Step 3: Install Dependencies

```bash
npm install
```

Wait for installation to complete (~1-2 minutes on first run).

## Step 4: Setup Your Credentials

### 4.1 Create .env file

**Option A - Copy from example:**
```bash
cp .env.example .env
```

**Option B - Create manually:**
- Create new file named `.env` (with the dot!)
- Open with text editor

### 4.2 Get your Orgo.ai credentials

**Get API Key:**
1. Go to https://orgo.ai/projects
2. Click on Settings → API Keys
3. Create new API key
4. Copy the key (starts with ``)

**Get Computer ID:**
1. Go to your Orgo project
2. Open a running computer
3. Look at top of page: "Computer ID: xxxxx..."
4. Copy the entire UUID

### 4.3 Fill in .env file

```env
# Account 1
ORGO_KEY_1=
ORGO_COMP_1=

# Account 2
ORGO_KEY_2=
ORGO_COMP_2=
# Add more accounts...
```

**Important:**
- Replace the example values with YOUR actual keys
- No spaces around the `=` sign
- Keys must be numbered sequentially (1, 2, 3...)

## Step 5: Run the Monitor

```bash
node multi_monitor.js
```

You should see:
```
🚀 Starting ORGO Monitor...
⏳ Initializing...
✅ OCR engine ready!
📊 Found X accounts
🔌 Connecting to all VPS...
   ✅ Connected to account #1
   ✅ Connected to account #2
   ...
```

**Wait for dashboard to appear!** (~10-30 seconds on first run)

## Step 6: Done! 🎉

The dashboard will refresh automatically every 60 seconds.

**To stop:** Press `Ctrl+C`

---

## Common Issues & Quick Fixes

### ❌ "Cannot find module 'tesseract.js'"
```bash
npm install
```

### ❌ "No accounts found in .env"
- Make sure `.env` file exists
- Check format: `ORGO_KEY_1=...` (no spaces!)
- Must start from `ORGO_KEY_1` (not 0)

### ❌ "Computer not found"
- Computer ID might be wrong
- Go to Orgo dashboard and copy the correct ID
- Make sure the computer is RUNNING in Orgo

### ❌ OCR download stuck
- Just wait, it's downloading language data (~10MB)
- Only happens on first run
- Next runs will be instant

---

## What's Next?

### Run 24/7 in Background

```bash
# Install PM2
npm install -g pm2

# Start monitor
pm2 start multi_monitor.js --name "orgo-monitor"

# Check status
pm2 status

# View logs
pm2 logs orgo-monitor
```

### Customize Settings

Edit `multi_monitor.js`:

```javascript
const CONFIG = {
    autoRefreshSeconds: 60,  // Change to 120 for 2 minutes
    startIndex: 1,           // Change if starting from account #3, etc
};

### Add More Accounts

Just add to `.env`:
```env
ORGO_KEY_5=
ORGO_COMP_5=


Restart the monitor and it will automatically detect new accounts!

---

## Need Help?

1. Read full README.md
2. Check GitHub Issues
3. Create new issue with error details

**Happy Monitoring!** 🎯
