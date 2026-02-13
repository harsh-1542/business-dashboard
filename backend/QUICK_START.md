# CareOps Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd careops-backend
npm install
```

### Step 2: Setup Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update these values:
# - DB_PASSWORD (your PostgreSQL password)
# - JWT_SECRET (use a strong random string)
# - JWT_REFRESH_SECRET (use another strong random string)
```

### Step 3: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE careops_db;

# Exit psql
\q
```

### Step 4: Run Migrations
```bash
npm run migrate
```

### Step 5: Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Your server is now running at `http://localhost:5000`! 🎉

---

## 📝 Test Your API

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "CareOps API is running",
  "timestamp": "2025-02-11T10:00:00.000Z"
}
```

### Test 2: Register an Owner
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@test.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "Owner"
  }'
```

Save the `accessToken` from the response!

### Test 3: Create a Workspace
```bash
# Replace YOUR_ACCESS_TOKEN with the token from step 2
curl -X POST http://localhost:5000/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "businessName": "Test Business",
    "address": "123 Test St",
    "timezone": "America/New_York",
    "contactEmail": "contact@test.com"
  }'
```

### Test 4: Get Workspace Status
```bash
# Replace YOUR_ACCESS_TOKEN and WORKSPACE_ID
curl -X GET http://localhost:5000/api/workspaces/WORKSPACE_ID/status \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🔧 Common Issues & Solutions

### Issue: Database connection failed
**Solution:** Check your PostgreSQL is running and credentials in `.env` are correct
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Or on macOS
brew services list
```

### Issue: Port 5000 already in use
**Solution:** Change the PORT in `.env` file
```env
PORT=5001
```

### Issue: JWT secret not set
**Solution:** Generate strong secrets and add to `.env`
```bash
# Generate random secrets (run twice for two different secrets)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📊 Project Structure Overview

```
careops-backend/
├── src/
│   ├── config/           # Database configuration
│   ├── controllers/      # Business logic
│   ├── database/         # Schema and migrations
│   ├── middleware/       # Auth, validation, errors
│   ├── routes/          # API endpoints
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation
│   └── server.js        # Main entry point
├── .env.example         # Environment template
├── package.json
└── README.md
```

---

## 🎯 Next Steps

1. **Read the full documentation**: Check `README.md` for detailed information
2. **Review API docs**: See `API_DOCUMENTATION.md` for all endpoints
3. **Explore the schema**: Check `src/database/schema.js` for database structure
4. **Build your frontend**: Use the API endpoints to build your UI
5. **Add more features**: Extend with bookings, forms, inventory, etc.

---

## 🆘 Need Help?

- Read the full `README.md` in the project root
- Check `API_DOCUMENTATION.md` for detailed endpoint specs
- Review the code comments in each file
- Test endpoints using Postman or cURL

---

## ✅ Checklist

Before moving to production:
- [ ] Change all default secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Review security headers
- [ ] Test all endpoints thoroughly

---

**Happy Coding! 🚀**