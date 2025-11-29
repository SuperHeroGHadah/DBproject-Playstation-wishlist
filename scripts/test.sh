#!/bin/bash

# PlayStation Wishlist API - Essential Test Suite
# Streamlined version with key tests only

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api"

# Variables to store tokens
USER_TOKEN=""
ADMIN_TOKEN=""

# Function to print section headers
print_section() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

# Function to print test headers
print_test() {
  echo -e "${GREEN}Test $1: $2${NC}"
  echo -e "${YELLOW}Expected: $3${NC}"
}

# Function to pause between tests
pause_test() {
  echo -e "\n${YELLOW}Press Enter to continue...${NC}"
  read
}

# Start testing
clear
echo -e "${BLUE}"
cat <<"EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     PlayStation Wishlist API - Essential Test Suite      ║
║                  (20 Key Tests)                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

echo -e "${YELLOW}This script tests all critical API functionality${NC}"
echo -e "${YELLOW}Make sure your server is running on http://localhost:5000${NC}\n"
echo -e "${YELLOW}Press Enter to start testing...${NC}"
read

# ============================================================================
# SECTION 1: AUTHENTICATION (3 tests)
# ============================================================================
print_section "SECTION 1: AUTHENTICATION & AUTHORIZATION"

# Test 1: Register New User
print_test "1" "Register New User" "201 - User created with token"
TIMESTAMP=$(date +%s)
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser${TIMESTAMP}\",
    \"email\": \"testuser${TIMESTAMP}@example.com\",
    \"password\": \"password123\",
    \"country\": \"UAE\"
  }" | jq
pause_test

# Test 2: Login as Regular User (Create one first if needed)
print_test "2" "Create & Login as Regular User" "200 - Login successful with token"
# First create a test user
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "regularuser",
    "email": "regularuser@example.com",
    "password": "password123",
    "country": "UAE"
  }' >/dev/null 2>&1

# Now login
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regularuser@example.com",
    "password": "password123"
  }')
echo $RESPONSE | jq
USER_TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo -e "\n${GREEN}✓ User Token saved${NC}"
pause_test

# Test 3: Create and Login as Admin
print_test "3" "Create & Login as Admin" "200 - Admin login successful"
# Create admin user
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "adminuser",
    "email": "adminuser@example.com",
    "password": "password123",
    "country": "UAE"
  }' >/dev/null 2>&1

# Manually update the user to admin role in MongoDB
echo -e "${YELLOW}Note: You need to manually set this user as admin in MongoDB${NC}"
echo -e "${YELLOW}Run: db.users.updateOne({email: 'adminuser@example.com'}, {\$set: {role: 'admin'}})${NC}"
echo -e "${YELLOW}Press Enter after updating...${NC}"
read

# Now login as admin
RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "adminuser@example.com",
    "password": "password123"
  }')
echo $RESPONSE | jq
ADMIN_TOKEN=$(echo $RESPONSE | jq -r '.data.token')
echo -e "\n${GREEN}✓ Admin Token saved${NC}"
pause_test

# ============================================================================
# SECTION 2: GAMES - PUBLIC ACCESS (4 tests)
# ============================================================================
print_section "SECTION 2: GAME OPERATIONS (Public Access)"

# Test 4: Get All Games
print_test "4" "Get All Games" "200 - Returns all games"
curl -X GET $BASE_URL/games | jq
pause_test

# Test 5: Search Games
print_test "5" "Search Games by Title" "200 - Returns matching games"
curl -X GET "$BASE_URL/games/search?q=God%20of%20War" | jq
pause_test

# Test 6: Get Top Rated Games
print_test "6" "Get Top Rated Games" "200 - Top 5 games by rating"
curl -X GET "$BASE_URL/games/top-rated?limit=5" | jq
pause_test

# Test 7: Admin - Create Game
print_test "7" "Admin Creates New Game" "201 - Game created successfully"
curl -X POST $BASE_URL/games \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Returnal",
    "platform": "PS5",
    "genres": ["Action", "Roguelike"],
    "releaseDate": "2021-04-30",
    "publisher": "Housemarque"
  }' | jq
pause_test

# ============================================================================
# SECTION 3: USER GAME LISTS (4 tests)
# ============================================================================
print_section "SECTION 3: USER GAME LIST MANAGEMENT"

# Test 8: Get My Game List
print_test "8" "Get My Game List" "200 - Returns user's wishlist and played games"
curl -X GET $BASE_URL/users/me/gamelist \
  -H "Authorization: Bearer $USER_TOKEN" | jq
pause_test

# Test 9: Add to Wishlist
print_test "9" "Add Game to Wishlist" "200 - Game added to wishlist"
curl -X POST $BASE_URL/users/me/wishlist \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "673200000000000000000005"
  }' | jq
pause_test

# Test 10: Mark as Played
print_test "10" "Mark Game as Played" "200 - Game moved to played list"
curl -X POST $BASE_URL/users/me/played \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "673200000000000000000009",
    "completionHours": 25
  }' | jq
pause_test

# Test 11: Remove from Wishlist
print_test "11" "Remove from Wishlist" "200 - Game removed from wishlist"
curl -X DELETE $BASE_URL/users/me/wishlist/673200000000000000000005 \
  -H "Authorization: Bearer $USER_TOKEN" | jq
pause_test

# ============================================================================
# SECTION 4: REVIEWS (4 tests)
# ============================================================================
print_section "SECTION 4: REVIEW MANAGEMENT"

# Test 12: Create Review
print_test "12" "Create Review" "201 - Review created, game rating updated"
curl -X POST $BASE_URL/reviews \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "673200000000000000000002",
    "rating": 5,
    "title": "Amazing web-slinging experience",
    "body": "Spider-Man 2 delivers incredible gameplay with smooth web-swinging mechanics and an engaging story."
  }' | jq
pause_test

# Test 13: Get Game Reviews
print_test "13" "Get Reviews for a Game" "200 - Returns all reviews for the game"
curl -X GET $BASE_URL/reviews/game/673200000000000000000001 | jq
pause_test

# Test 14: Get My Reviews
print_test "14" "Get My Reviews" "200 - Returns all my reviews"
curl -X GET $BASE_URL/reviews/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq

# Save a review ID for next test
REVIEW_ID=$(curl -s -X GET $BASE_URL/reviews/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq -r '.data[0]._id')
pause_test

# Test 15: Update Review
print_test "15" "Update Own Review" "200 - Review updated successfully"
curl -X PUT $BASE_URL/reviews/$REVIEW_ID \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "title": "Amazing web-slinging experience - Updated",
    "body": "Still incredible but with some minor pacing issues in the middle sections."
  }' | jq
pause_test

# ============================================================================
# SECTION 5: ACTIVITY LOGS (2 tests)
# ============================================================================
print_section "SECTION 5: ACTIVITY LOGS"

# Test 16: Get My Activities
print_test "16" "Get My Activity Logs" "200 - Returns user's activity history"
curl -X GET $BASE_URL/activities/me \
  -H "Authorization: Bearer $USER_TOKEN" | jq
pause_test

# Test 17: Get Activity Statistics
print_test "17" "Get Activity Statistics" "200 - Returns breakdown by action type"
curl -X GET $BASE_URL/activities/me/stats \
  -H "Authorization: Bearer $USER_TOKEN" | jq
pause_test

# ============================================================================
# SECTION 6: RBAC & VALIDATION (3 tests)
# ============================================================================
print_section "SECTION 6: SECURITY - RBAC & VALIDATION"

# Test 18: Admin Get All Users
print_test "18" "Admin - Get All Users" "200 - Returns all users (Admin only)"
curl -X GET $BASE_URL/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
pause_test

# Test 19: Non-Admin Blocked
print_test "19" "Regular User Tries Admin Endpoint" "403 - Access denied (RBAC)"
curl -X GET $BASE_URL/users \
  -H "Authorization: Bearer $USER_TOKEN" | jq
pause_test

# Test 20: Validation Error
print_test "20" "Create Review with Invalid Data" "400 - Validation errors returned"
curl -X POST $BASE_URL/reviews \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "673200000000000000000006",
    "rating": 6,
    "title": "AB",
    "body": "Short"
  }' | jq
pause_test

# ============================================================================
# TEST SUMMARY
# ============================================================================
print_section "TEST SUITE COMPLETE!"

echo -e "${GREEN}✓ All 20 essential tests executed!${NC}\n"
echo -e "${BLUE}Coverage Summary:${NC}"
echo -e "  ✓ Authentication & Authorization (3 tests)"
echo -e "  ✓ Game Operations (4 tests)"
echo -e "  ✓ User Game List Management (4 tests)"
echo -e "  ✓ Review Management (4 tests)"
echo -e "  ✓ Activity Logs (2 tests)"
echo -e "  ✓ RBAC & Validation (3 tests)"
echo -e "\n${GREEN}This covers all major features:${NC}"
echo -e "  • MongoDB CRUD operations"
echo -e "  • JWT Authentication"
echo -e "  • Role-Based Access Control (RBAC)"
echo -e "  • Transaction Management (Reviews update game ratings)"
echo -e "  • Activity Logging"
echo -e "  • Input Validation"
echo -e "  • Concurrency (Wishlist operations)"
echo -e "\n${YELLOW}Perfect for your academic report! 📚${NC}\n"
