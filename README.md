# PlayStation Game Wishlist & Review System

A RESTful API backend for managing PlayStation game wishlists, reviews, and activity tracking. Built with Node.js, Express.js, and MongoDB.

**Course:** COSC 412 – Implementation of Database Systems  
**Team Members:**
- Ghada Fuad Aelaiw (F2400234)
- Hussain Nawaf Alqaed (F2300134)

---

## Table of Contents

1. [Required Tools & Downloads](#required-tools--downloads)
2. [Project Structure](#project-structure)
3. [Installation Guide](#installation-guide)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Running Tests](Running-The-Test-Script)
8. [Backup & Recovery](#backup--recovery)
9. [API Endpoints Overview](#api-endpoints-overview)

---

## Required Tools & Downloads

| Tool | Version Used|
|------|--------------|
| Node.js | v20.x LTS or higher      |
| npm | v10.x (included with Node.js)|
| MongoDB Atlas | Cloud (Free Tier)  |
| Git | v2.40+ (Optional)            |
| VS Code | Latest (Recommended IDE) |
| Postman | Latest (API Testing)     |
| jq | Latest (For test script)      |

---

## Project Structure

```
playstation-wishlist-api/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── authController.js
│   │   ├── gameController.js
│   │   ├── reviewController.js
│   │   ├── userController.js
│   │   └── userGameListController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── rbac.js              # Role-based access control
│   │   └── validator.js         # Input validation middleware
│   ├── models/
│   │   ├── ActivityLog.js
│   │   ├── Game.js
│   │   ├── Review.js
│   │   ├── User.js
│   │   └── UserGameList.js
│   ├── routes/
│   │   ├── activitiesroutes.js
│   │   ├── authroutes.js
│   │   ├── gamesroutes.js
│   │   ├── reviewsroutes.js
│   │   └── usersroutes.js
│   └── server.js                # Main application entry point
├── data/
│   ├── users.json               # Sample user data
│   ├── games.json               # Sample game data
│   ├── reviews.json             # Sample review data
│   ├── userGameList.json        # Sample wishlist/played data
│   └── activitiesLogs.json      # Sample activity logs
├── scripts/
│   ├── seed.js                  # Database seeding script
│   ├── backup.sh                # Database backup script
│   ├── test.sh               # Database testing script
│   └── restore.sh               # Database restore script
├── .env                         # Environment variables (create this)
├── .env.example                 # Environment variables with placeholders
├── package.json                 # Dependencies and scripts
├── test_output.txt              # API testing script output
└── README.md                    # This file
```

---

## Installation Guide

### Step 1: Download/Clone the Project

**Option A - Download ZIP Exactly as it is and extract it**

**Option B - Clone from GitHub:**
```bash
git clone https://github.com/SuperHeroGHadah/DBproject-Playstation-wishlist.git
cd DBproject-Playstation-wishlist
```

### Step 2: Install Dependencies

```bash
cd playstation-wishlist-api
npm install
```

**Required Packages**

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.1.0 | Web framework |
| mongoose | ^8.19.4 | MongoDB ODM |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| cors | ^2.8.5 | Cross-origin resource sharing |
| helmet | ^8.1.0 | Security headers |
| express-rate-limit | ^8.2.1 | Rate limiting |
| express-validator | ^7.3.0 | Input validation |
| dotenv | ^17.2.3 | Environment variables |
| nodemon | ^3.1.11 | Development auto-restart |

---

## Environment Configuration

In order to safekeep the database from being scraped off of Github, the .env used in production was omitted and a placeholder was put in. Follow the steps below in order to make the product work 

**Step 1: Create Environment File**

Rename .env.example to .env


**Step 2: Add Environment Variables**

Open .env in a text editor and add the following:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_secure_random_string_here_at_least_32_characters
JWT_EXPIRE=30d
```

### Step 3: MongoDB Atlas Setup (If using cloud database)

1. Go to MongoDB Atlas (https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Create a new cluster
4. Click "Connect" then "Connect your application"
5. Copy the connection string
6. Replace `<username>`, `<password>`, and `<database>` in your `.env` file

**This step is very very important as doing this incorrectly means that the connection will not work**

---

## Database Setup

### Option 1: Use the Provided Seed Script

The seed script will populate the database with sample data, be careful as the script will clear all data on the cluster before proceeding so make sure to do it only when absolutelys ure

```bash
node scripts/seed.js
```

**If you see this output below, you have done everything correctly**
```
MongoDB Connected
Data cleared
Users seeded
Games seeded
Reviews seeded
Game lists seeded
Activities seeded
Database seeded successfully!
```
### Sample Data Included

| Collection | Records |
|------------|---------|
| users | 10 |
| games | 10 |
| reviews | 10 |
| usergamelists | 10 |
| activitylogs | 10 |

---

## Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Verify Server is Running

Do not worry if you see a long wall of text, as long as you see the text below know that you have successfully connected to the database
```
MongoDB Connected: <cluster-name>
Server running in development mode on port 5000
```

Test your connectivity by following the url below
```bash
http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "PlayStation Wishlist API is running",
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

---

## Running The Test Script

### Prerequisites for Testing

1. Make `jq` is installed (for JSON formatting)
2. Run the server on one terminal instance
**IF ON WINDOWS:**
3. Open a Git Bash or similar shell to be able to execute the shell script
**IF ON LINUX**
3. Run the script in the given shell


**It is recommended to run this script directly before using the test script**
```bash
node scripts/seed.js
```

### Step 3: Run Test Suite

```bash
./test.sh
```

**On Windows (Git Bash or WSL):**
```bash
bash test.sh
```

### Test Sections

There is a total of 20 tests, all the user has to do is press enter and keep an eye on the JSON output of each test, as long as success is true then the test is passed.
There is only one exception to that which is the RBAC and Validation tests where we define their failure as our success.
| Section | Tests | Features Tested |
|---------|-------|-----------------|
| Authentication | 3 | Register, Login, Admin Auth |
| Game Operations | 4 | Get All, Search, Top Rated, Create |
| User Game Lists | 4 | Get List, Add/Remove Wishlist, Mark Played |
| Review Management | 4 | Create, Get, Update Reviews |
| Activity Logs | 2 | Get Activities, Get Stats |
| Security (RBAC) | 3 | Admin Access, User Denial, Validation |


## Backup & Recovery

### Creating a Backup

```bash
./scripts/backup.sh
```

Backups are stored in `./backups/backup_YYYY-MM-DD_HH-MM-SS/`
The directory will be created if not present beforehand

### Restoring from Backup

```bash
./scripts/restore.sh
```

The script will:
1. List available backups
2. Let you choose which backup to restore
3. Confirm before overwriting current data

---

## API Endpoints Overview

### Base URL
```
http://localhost:5000/api
```

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| GET | `/auth/me` | Get current profile | Private |

### Games
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/games` | Get all games | Public |
| GET | `/games/search?q=` | Search games | Public |
| GET | `/games/top-rated` | Get top rated | Public |
| POST | `/games` | Create game | Admin |
| PUT | `/games/:id` | Update game | Admin |
| DELETE | `/games/:id` | Delete game | Admin |

### User Game Lists
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users/me/gamelist` | Get full list | Private |
| POST | `/users/me/wishlist` | Add to wishlist | Private |
| DELETE | `/users/me/wishlist/:gameId` | Remove from wishlist | Private |
| POST | `/users/me/played` | Mark as played | Private |

### Reviews
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reviews/game/:gameId` | Get game reviews | Public |
| GET | `/reviews/me` | Get my reviews | Private |
| POST | `/reviews` | Create review | Private |
| PUT | `/reviews/:id` | Update review | Private |
| DELETE | `/reviews/:id` | Delete review | Private/Admin |

### Activity Logs
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/activities/me` | Get my activities | Private |
| GET | `/activities/me/stats` | Get my stats | Private |

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
- Check your `MONGODB_URI` in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure database user credentials are correct

**2. Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

**3. Module Not Found**
```bash
rm -rf node_modules
npm install
```

**4. Permission Denied (Scripts)**
```bash
chmod +x test.sh scripts/backup.sh scripts/restore.sh
```

---

## Support

For issues or questions:
- GitHub: https://github.com/SuperHeroGHadah/DBproject-Playstation-wishlist
- Create an issue on the repository

---

## License

This project was created for educational purposes as part of COSC 412 at the American University of Bahrain.
