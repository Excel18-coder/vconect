#!/bin/bash

# Comprehensive Backend Route Testing Script
# Tests all endpoints systematically

echo "🧪 COMPREHENSIVE V-MARKET API TESTING"
echo "====================================="

BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    local description=$6
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}[$TOTAL_TESTS] Testing: $description${NC}"
    echo "Method: $method | Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        if [ -z "$headers" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$API_URL$endpoint")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$API_URL$endpoint" -H "$headers")
        fi
    else
        if [ -z "$headers" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -H "$headers" -d "$data")
        fi
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} - Status: $http_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC} - Expected: $expected_status, Got: $http_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "Response: $body" | head -c 200
    echo ""
}

echo -e "\n${YELLOW}🏥 1. HEALTH CHECK ENDPOINTS${NC}"
echo "==============================="

# Health endpoint is at root level, not under /api
curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$BASE_URL/health" > /tmp/health_response
HEALTH_CODE=$(cat /tmp/health_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
HEALTH_BODY=$(cat /tmp/health_response | sed -e 's/HTTPSTATUS:.*//g')

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "\n${BLUE}[$TOTAL_TESTS] Testing: Health check endpoint${NC}"
echo "Method: GET | Endpoint: /health"

if [ "$HEALTH_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC} - Status: $HEALTH_CODE"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Expected: 200, Got: $HEALTH_CODE"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo "Response: $HEALTH_BODY" | head -c 200

test_endpoint "GET" "/" "" "" "200" "API info endpoint"

echo -e "\n${YELLOW}🔐 2. AUTHENTICATION ENDPOINTS${NC}"
echo "==============================="

# Generate unique email for testing
TIMESTAMP=$(date +%s)
TEST_EMAIL="test$TIMESTAMP@vmarket.com"
TEST_PASSWORD="TestPass123!"

# Test user registration
test_endpoint "POST" "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"displayName\":\"Test User $TIMESTAMP\"}" "" "201" "User registration"

# Test user login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

test_endpoint "POST" "/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "" "200" "User login"

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ Access token obtained: ${ACCESS_TOKEN:0:20}...${NC}"
    
    # Test protected endpoints
    test_endpoint "GET" "/auth/me" "" "Authorization: Bearer $ACCESS_TOKEN" "200" "Get current user"
    
    # Test token refresh (get fresh token first)
    REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    FRESH_REFRESH_TOKEN=$(echo $REFRESH_RESPONSE | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$FRESH_REFRESH_TOKEN" ]; then
        test_endpoint "POST" "/auth/refresh-token" "{\"refreshToken\":\"$FRESH_REFRESH_TOKEN\"}" "" "200" "Token refresh"
    fi
    
    # Test logout
    test_endpoint "POST" "/auth/logout" "{\"refreshToken\":\"$REFRESH_TOKEN\"}" "Authorization: Bearer $ACCESS_TOKEN" "200" "User logout"
else
    echo -e "${RED}❌ Failed to obtain access token${NC}"
fi

# Test invalid login
test_endpoint "POST" "/auth/login" "{\"email\":\"invalid@email.com\",\"password\":\"wrongpass\"}" "" "401" "Invalid login attempt"

# Test registration with existing email
test_endpoint "POST" "/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "" "409" "Duplicate email registration"

echo -e "\n${YELLOW}👤 3. PROFILE ENDPOINTS${NC}"
echo "========================"

# Re-login to get fresh token for profile tests
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
    # Test get profile
    test_endpoint "GET" "/profile" "" "Authorization: Bearer $ACCESS_TOKEN" "200" "Get user profile"
    
    # Test update profile
    test_endpoint "PUT" "/profile" "{\"displayName\":\"Updated Test User\",\"bio\":\"Test bio\",\"userType\":\"seller\",\"location\":\"Nairobi\"}" "Authorization: Bearer $ACCESS_TOKEN" "200" "Update user profile"
    
    # Test avatar update
    test_endpoint "PATCH" "/profile/avatar" "{\"avatarUrl\":\"https://example.com/avatar.jpg\"}" "Authorization: Bearer $ACCESS_TOKEN" "200" "Update avatar URL"
    
    # Test search profiles
    test_endpoint "GET" "/profile/search?query=test" "" "" "200" "Search profiles"
else
    echo -e "${RED}❌ Cannot test profile endpoints - no access token${NC}"
fi

echo -e "\n${YELLOW}📁 4. UPLOAD ENDPOINTS${NC}"
echo "======================"

if [ ! -z "$ACCESS_TOKEN" ]; then
    # Test get upload signature
    test_endpoint "POST" "/upload/signature" "{\"folder\":\"test\"}" "Authorization: Bearer $ACCESS_TOKEN" "200" "Get upload signature"
    
    # Test transform endpoint (this might fail without actual image)
    test_endpoint "GET" "/upload/transform/test_image?w=100&h=100" "" "Authorization: Bearer $ACCESS_TOKEN" "404" "Transform image URL"
else
    echo -e "${RED}❌ Cannot test upload endpoints - no access token${NC}"
fi

echo -e "\n${YELLOW}🔒 5. AUTHORIZATION TESTS${NC}"
echo "========================="

# Test protected endpoints without token
test_endpoint "GET" "/auth/me" "" "" "401" "Protected endpoint without token"
test_endpoint "GET" "/profile" "" "" "401" "Profile endpoint without token"
test_endpoint "POST" "/upload/signature" "{}" "" "401" "Upload endpoint without token"

# Test with invalid token
test_endpoint "GET" "/auth/me" "" "Authorization: Bearer invalid_token" "401" "Protected endpoint with invalid token"

echo -e "\n${YELLOW}📊 6. VALIDATION TESTS${NC}"
echo "======================"

# Add delay to avoid rate limiting
sleep 2

# Test invalid data with different email to avoid rate limiting
VALIDATION_EMAIL="validation$(date +%s)@test.com"
test_endpoint "POST" "/auth/register" "{\"email\":\"invalid-email\",\"password\":\"123\"}" "" "400" "Registration with invalid email"

sleep 1
test_endpoint "POST" "/auth/login" "{}" "" "400" "Login with missing data"

if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint "PUT" "/profile" "{\"userType\":\"invalid_type\"}" "Authorization: Bearer $ACCESS_TOKEN" "400" "Profile update with invalid data"
fi

echo -e "\n${YELLOW}🌐 7. CORS AND HEADERS TEST${NC}"
echo "============================"

# Test CORS preflight
CORS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X OPTIONS "$API_URL/auth/login" -H "Origin: http://localhost:8080" -H "Access-Control-Request-Method: POST")
CORS_CODE=$(echo $CORS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$CORS_CODE" = "200" ] || [ "$CORS_CODE" = "204" ]; then
    echo -e "${GREEN}✅ CORS preflight working${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ CORS preflight failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}📈 8. PERFORMANCE TESTS${NC}"
echo "======================="

# Test response times
start_time=$(date +%s.%N)
curl -s "$BASE_URL/health" > /dev/null
end_time=$(date +%s.%N)
response_time=$(echo "$end_time - $start_time" | bc)
echo "Health endpoint response time: ${response_time}s"

if (( $(echo "$response_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ Response time acceptable${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️ Response time slow${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo -e "\n${YELLOW}🧹 9. CLEANUP${NC}"
echo "============="

# Clean up test user
if [ ! -z "$ACCESS_TOKEN" ]; then
    curl -s -X DELETE "$API_URL/test/cleanup/$TEST_EMAIL" -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null
    echo "Test user cleanup attempted"
fi

echo -e "\n${BLUE}📊 FINAL RESULTS${NC}"
echo "================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

SUCCESS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
echo -e "Success Rate: ${SUCCESS_RATE}%"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Backend is fully functional.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️ Some tests failed. Check the results above.${NC}"
    exit 1
fi
