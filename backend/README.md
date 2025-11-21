# Publisher Backend API

🚀 Backend server for the Publisher multilingual publishing platform

---

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher
- **npm** or **yarn**

### Installation Steps

```bash
# 1. Clone and navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your database credentials
# (Use a text editor like notepad, VS Code, or nano)

# 5. Create database
createdb publisher_db

# 6. Setup database tables
npm run db:setup

# 7. (Optional) Add sample data
npm run db:seed

# 8. Start the server
npm start
```

The server will start at: **http://localhost:3000**

---

## 💾 Database Setup

### Step 1: Install PostgreSQL

#### Windows:
1. Download from https://www.postgresql.org/download/windows/
2. Run the installer
3. Set a password (remember this!)
4. Use default port: 5432

#### Mac:
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database

**Option A: Using Command Line**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE publisher_db;

# Exit
\q
```

**Option B: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Right-click "Databases"
3. Select "Create" > "Database"
4. Name it: `publisher_db`
5. Click "Save"

### Step 3: Configure Environment

Edit the `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=publisher_db
DB_USER=postgres
DB_PASSWORD=your_password_here  # ← Change this!
```

### Step 4: Run Setup Script

```bash
npm run db:setup
```

This creates all necessary tables.

### Step 5: Add Test Data (Optional)

```bash
npm run db:seed
```

This creates 3 test accounts:
- author@publisher.com
- translator@publisher.com
- editor@publisher.com

All passwords: `password123`

---

## 🔌 API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and database connection.

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "author",
  "penName": "J.D. Writer",
  "country": "US"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "author"
  },
  "token": "jwt_token_here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {your_jwt_token}
```

### Users

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "bio": "Updated bio"
}
```

### Works

#### Get All Published Works
```http
GET /api/works?page=1&limit=20&genre=fiction
```

#### Get Single Work
```http
GET /api/works/:workId
```

#### Create New Work
```http
POST /api/works
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Amazing Story",
  "description": "A tale of adventure",
  "originalLanguage": "en",
  "contentType": "text",
  "genre": "fiction",
  "price": 9.99,
  "isFree": false
}
```

#### Get My Works
```http
GET /api/works/my/all
Authorization: Bearer {token}
```

### Translations

#### Get Work Translations
```http
GET /api/translations/work/:workId
```

#### Request Translation
```http
POST /api/translations
Authorization: Bearer {token}
Content-Type: application/json

{
  "workId": "work_uuid",
  "targetLanguage": "es",
  "translationType": "human"
}
```

---

## 🔐 Authentication

### JWT Token

The API uses JWT (JSON Web Tokens) for authentication.

1. **Login or Register** to get a token
2. **Include token** in subsequent requests:
   ```
   Authorization: Bearer {your_token}
   ```
3. **Token expires** in 7 days (configurable)

### Testing with curl

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"author@publisher.com","password":"password123"}'

# 2. Copy the token from response

# 3. Use token in protected routes
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer {paste_token_here}"
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | publisher_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | *required* |
| `JWT_SECRET` | JWT signing key | *change in production!* |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `FRONTEND_URL` | Frontend URL (CORS) | http://localhost:8000 |

---

## 🔧 Development

### Start in Development Mode

```bash
npm run dev
```

This uses `nodemon` to auto-restart on file changes.

### Testing Endpoints

**Option 1: Using curl**
```bash
curl http://localhost:3000/api/health
```

**Option 2: Using Postman**
1. Download Postman
2. Import the API collection (coming soon)
3. Test endpoints with GUI

**Option 3: Using the Frontend**
1. Start the backend: `npm start`
2. Start the frontend: `python -m http.server 8000`
3. Open http://localhost:8000
4. Register and login through the UI

---

## ❌ Troubleshooting

### Error: "Database connection failed"

**Problem**: Cannot connect to PostgreSQL

**Solutions**:
1. Check if PostgreSQL is running:
   ```bash
   # Mac
   brew services list
   
   # Windows
   services.msc (look for postgresql)
   
   # Linux
   sudo systemctl status postgresql
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

3. Check credentials in `.env` file

4. Try connecting manually:
   ```bash
   psql -U postgres -d publisher_db
   ```

### Error: "Port 3000 already in use"

**Solution**: Change port in `.env`:
```env
PORT=3001
```

### Error: "Cannot find module"

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

### Error: "relation does not exist"

**Solution**: Run database setup:
```bash
npm run db:setup
```

---

## 📄 API Documentation

Full API documentation available at:
- Swagger UI: http://localhost:3000/api-docs (coming soon)
- Postman Collection: [Download](docs/postman_collection.json)

---

## 👥 Support

If you encounter issues:

1. Check this README
2. Search GitHub Issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, PostgreSQL version)

---

## 🛣️ Roadmap

- [x] Basic authentication
- [x] User management
- [x] Works CRUD operations
- [x] Translation system
- [ ] File upload (S3)
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] AI translation (Claude API)
- [ ] Advanced analytics
- [ ] WebSocket for real-time updates

---

**Built with ❤️ for the Publisher platform**