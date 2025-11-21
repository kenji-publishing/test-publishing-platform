# 📚 Publisher Platform - Complete Setup Guide

This guide will walk you through setting up the **entire Publisher platform** from scratch, even if you're not familiar with programming.

---

## 📋 What You'll Need

### Software to Install:
1. **Node.js** - Runs JavaScript on your computer
2. **PostgreSQL** - Database to store all data
3. **Git** - Version control (you probably have this)
4. **A text editor** - VS Code, Notepad++, or Sublime Text

### Time Required:
- Installation: 15-20 minutes
- Setup: 10-15 minutes
- **Total: About 30-35 minutes**

---

## 💻 Step 1: Install Node.js

Node.js allows you to run JavaScript code on your computer (not just in browsers).

### Windows:
1. Go to https://nodejs.org/
2. Click the **LTS** version (green button)
3. Download and run the installer
4. Keep clicking "Next" with default settings
5. Restart your computer

### Mac:
1. Go to https://nodejs.org/
2. Click the **LTS** version
3. Open the downloaded file and follow instructions
4. Or use Homebrew: `brew install node`

### Verify Installation:
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
npm --version
```

You should see version numbers like `v20.x.x` and `10.x.x`

✅ **Success!** Node.js is installed.

---

## 💾 Step 2: Install PostgreSQL

PostgreSQL is our database - where all users, works, and data are stored.

### Windows:

1. **Download**:
   - Go to https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Choose Windows x86-64 (latest version)

2. **Install**:
   - Run the downloaded file
   - **Important settings**:
     - Password: Choose something you'll remember (like `publisher123`)
     - Port: Keep as `5432`
     - Locale: Choose "English" or your language
   - When asked about Stack Builder, you can skip it

3. **Verify**:
   - Search for "pgAdmin" in your Start menu
   - Open it - you should see PostgreSQL listed

### Mac:

**Option A: Using Homebrew (Recommended)**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Option B: Download Installer**
1. Go to https://www.postgresql.org/download/macosx/
2. Download and install
3. Follow on-screen instructions

### Linux:
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create the Database:

**Windows**:
1. Open Command Prompt as Administrator
2. Type:
```bash
cd "C:\Program Files\PostgreSQL\15\bin"
createde publisher_db
```

**Mac/Linux**:
```bash
createdb publisher_db
```

**Alternative: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Enter your password
3. Right-click "Databases"
4. Select "Create" > "Database"
5. Name: `publisher_db`
6. Click "Save"

✅ **Success!** PostgreSQL is ready.

---

## 📎 Step 3: Get the Code

You probably already have the code from GitHub, but if not:

```bash
git clone https://github.com/kenji-publishing/test-publishing-platform.git
cd test-publishing-platform
```

---

## ⚙️ Step 4: Setup Backend

### 4.1: Navigate to Backend

```bash
cd backend
```

### 4.2: Install Dependencies

This downloads all the libraries the backend needs.

```bash
npm install
```

This may take 2-3 minutes. You'll see a lot of text scrolling - that's normal!

### 4.3: Configure Environment

1. **Find the `.env.example` file** in the `backend` folder

2. **Copy it** and rename to `.env`:
   
   **Windows Command Prompt**:
   ```bash
   copy .env.example .env
   ```
   
   **Mac/Linux**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file**:
   
   Open it in a text editor (Notepad, VS Code, etc.) and change:
   
   ```env
   DB_PASSWORD=publisher123
   ```
   
   Replace `publisher123` with the password you set for PostgreSQL.

4. **Save the file**

### 4.4: Setup Database Tables

This creates all the necessary tables (users, works, translations, etc.):

```bash
npm run db:setup
```

You should see:
```
💾 Starting database setup...
✅ ENUM types created
✅ Users table created
✅ User roles table created
...
✨ Database setup completed successfully!
```

### 4.5: Add Sample Data (Optional)

This creates 3 test user accounts:

```bash
npm run db:seed
```

Test accounts created:
- **Email**: `author@publisher.com` **Password**: `password123`
- **Email**: `translator@publisher.com` **Password**: `password123`
- **Email**: `editor@publisher.com` **Password**: `password123`

### 4.6: Start the Backend Server

```bash
npm start
```

You should see:
```
🚀 Publisher API Server is running!
📍 URL: http://localhost:3000
🌍 Environment: development
💾 Database: publisher_db@localhost:5432
```

**Keep this window open!** The server is running.

✅ **Success!** Backend is running!

---

## 🌐 Step 5: Test the Backend

### Test 1: Health Check

Open a **new** terminal/command prompt (keep the server running in the first one) and type:

```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Publisher API is running",
  "database": "connected"
}
```

### Test 2: Login with Sample Account

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"author@publisher.com\",\"password\":\"password123\"}"
```

You should receive a long token in the response.

✅ **Success!** API is working!

---

## 🖥️ Step 6: Run the Frontend

The frontend is already complete! You just need to serve it.

### Option 1: Using Python (Easiest)

```bash
# Navigate to project root
cd ..

# Start server
python -m http.server 8000
```

### Option 2: Using Node.js

```bash
npx http-server -p 8000
```

### Option 3: Using Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

---

## 🎉 Step 7: Open the Platform

Open your browser and go to:

**http://localhost:8000**

You should see the Publisher homepage!

### Test Features:

1. **Change Language** - Click the globe icon (top right)
2. **Register** - Create a new account
3. **Login** - Use test account: `author@publisher.com` / `password123`
4. **Upload** - Try uploading a work
5. **Dashboard** - View your dashboard

---

## ✅ Verification Checklist

- [ ] Node.js installed (`node --version` works)
- [ ] PostgreSQL installed (pgAdmin opens)
- [ ] Database created (`publisher_db` exists)
- [ ] Backend dependencies installed (`node_modules` folder exists)
- [ ] `.env` file configured (password set)
- [ ] Database tables created (setup script ran)
- [ ] Backend server running (http://localhost:3000/api/health works)
- [ ] Frontend server running (http://localhost:8000 opens)
- [ ] Can change language on frontend
- [ ] Can login with test account

---

## 🎯 Daily Usage

After initial setup, to start working each day:

### Start Backend:
```bash
cd backend
npm start
```

### Start Frontend (in a new terminal):
```bash
cd ..
python -m http.server 8000
```

### URLs:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

---

## ❌ Common Issues & Solutions

### Issue: "Cannot find module"

**Solution**:
```bash
cd backend
rm -rf node_modules
npm install
```

### Issue: "Port 3000 already in use"

**Solution**: Change port in `backend/.env`:
```env
PORT=3001
```

### Issue: "Database connection failed"

**Solutions**:
1. Check PostgreSQL is running
2. Verify password in `.env`
3. Ensure `publisher_db` database exists
4. Try: `psql -U postgres -d publisher_db`

### Issue: "Cannot connect to http://localhost:3000"

**Check**:
1. Is backend server running? (Look for the `npm start` terminal)
2. Check for error messages in that terminal
3. Try: `curl http://localhost:3000/api/health`

### Issue: Frontend shows "CORS error"

**Solution**: Check `FRONTEND_URL` in `backend/.env`:
```env
FRONTEND_URL=http://localhost:8000
```

---

## 📚 Next Steps

Now that everything is running:

1. **Explore the Platform**
   - Register different user types
   - Upload sample works
   - Test translations

2. **Customize**
   - Modify colors in `css/style.css`
   - Update text in `js/translations.js`
   - Add new features

3. **Deploy to Production**
   - See `DEPLOYMENT.md` (coming soon)
   - Use Heroku, AWS, or DigitalOcean

---

## 📞 Need Help?

- **GitHub Issues**: Report bugs or ask questions
- **Documentation**: Check `backend/README.md` for API details
- **Database Schema**: See `docs/database-design.md`

---

**Congratulations! 🎉**

You now have a fully functional multilingual publishing platform running on your computer!

---

**Made with ❤️ by the Publisher Team**