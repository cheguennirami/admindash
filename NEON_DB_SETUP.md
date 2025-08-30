# 🗄️ Neon Database Setup Guide

This guide explains how to set up your Neon database for the Shein TO YOU Dashboard.

## 📋 Prerequisites

- Neon account (https://neon.tech/)
- Project connected to GitHub

## 🚀 Database Setup Steps

### 1. Create Neon Database

1. Go to https://neon.tech/console (sign in with your account)
2. Click "Create a project"
3. Fill in your project details:
   - **Name**: `shein-dashboard-db`
   - **Region**: Choose nearest to your audience (e.g., `eu-central-1` for Europe, `us-east-1` for US)
   - **PostgreSQL version**: Latest (default)

### 2. Get Database Connection Details

1. In your Neon dashboard, click on your project
2. Go to the "Dashboard" tab
3. Copy the connection string, or get individual values:
   - **Host**: `ep-xxx.us-east-1.neon.tech`
   - **Database**: `neondb`
   - **Username**: Your account name
   - **Password**: Generated password (you can reset if needed)

### 3. Configure Environment Variables

#### For Local Development (.env file)
Update the `.env` file in your project root:
```env
NEON_HOST=ep-xxx.us-east-1.neon.tech
NEON_DATABASE=neondb
NEON_USERNAME=your_actual_username
NEON_PASSWORD=your_actual_password
```

#### For Netlify Deployment
1. Go to your Netlify site dashboard
2. Navigate to Site settings → Environment variables
3. Add these variables:
   - **NEON_HOST**: `ep-xxx.us-east-1.neon.tech`
   - **NEON_DATABASE**: `neondb`
   - **NEON_USERNAME**: `your_actual_username`
   - **NEON_PASSWORD**: `your_actual_password`

### 4. Create Database Tables

You have several options to create the tables:

#### Option A: Using Neon SQL Editor (Recommended)
1. In your Neon dashboard, click "SQL Editor"
2. Copy and paste the contents of `neon-tables.sql`
3. Click "Run" to execute the SQL

#### Option B: Using PostgreSQL Client
```bash
# Install psql if you don't have it
# On Ubuntu/Debian:
sudo apt-get install postgresql-client

# Connect to your Neon database
psql "postgresql://your_username:your_password@ep-xxx.us-east-1.neon.tech/neondb"

# Run the SQL file
\i neon-tables.sql
```

#### Option C: Using Node.js Script
Create a file called `setup-db.js`:
```javascript
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(`postgresql://${process.env.NEON_USERNAME}:${process.env.NEON_PASSWORD}@${process.env.NEON_HOST}/${process.env.NEON_DATABASE}?sslmode=require`);

async function setupDatabase() {
  try {
    console.log('🔄 Setting up Neon database...');

    // Read SQL file
    const fs = require('fs');
    const sqlContent = fs.readFileSync('neon-tables.sql', 'utf8');

    // Execute SQL
    await sql.unsafe(sqlContent);

    console.log('✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

setupDatabase();
```

Run it:
```bash
node setup-db.js
```

### 5. Test Database Connection

Create a simple test file to verify your database connection:

```javascript
// test-db.js
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(`postgresql://${process.env.NEON_USERNAME}:${process.env.NEON_PASSWORD}@${process.env.NEON_HOST}/${process.env.NEON_DATABASE}?sslmode=require`);

async function testConnection() {
  try {
    const result = await sql`SELECT COUNT(*)::int AS user_count FROM users`;
    console.log('✅ Database connection successful!');
    console.log(`👥 Users in database: ${result[0].user_count}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run the test:
```bash
node test-db.js
```

## 🎯 Database Structure

After setup, you'll have these tables:

- **users**: User accounts with roles and permissions
- **clients**: Customer/client information with financial data
- **payments**: Payment records linked to clients
- **settings**: Application configuration data

Initial test data is included for immediate testing.

## 🔐 Default Login

After setup, you can login with:
- **Email**: `admin@sheintoyou.com`
- **Password**: `AdminPassword123!`

## ⚠️ Security Notes

1. **Never commit database credentials** to version control
2. **Use strong passwords** in production
3. **Enable SSL mode** (`sslmode=require`) for all connections
4. **Consider implementing connection pooling** for production workloads
5. **Regularly rotate database passwords**
6. **Use least privilege access** principles

## 🐛 Troubleshooting

### Common Issues:

**Connection Refused**
- Verify host URL is correct
- Check if database is not paused (Neon auto-pauses after inactivity)
- Ensure SSL mode is enabled

**Authentication Failed**
- Double-check username and password
- Reset password in Neon dashboard if needed

**Table Creation Errors**
- Ensure you're connecting to the correct database (`neondb`)
- Check if tables already exist before running setup

## 📞 Support

If you encounter issues:
1. Check the Neon documentation: https://neon.tech/docs
2. Review this setup guide thoroughly
3. Ensure all environment variables are correctly set
4. Test your connection with the provided test script

Ready to deploy! 🚀