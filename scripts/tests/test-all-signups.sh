#!/bin/bash

# V-Market Signup Test for All Account Types
API_URL="http://localhost:5000/api"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "Testing Signup for All Account Types"
echo "========================================="
echo ""

# Array of account types to test
declare -a ACCOUNT_TYPES=("buyer" "seller" "landlord" "employer" "doctor" "tutor")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Test each account type
for TYPE in "${ACCOUNT_TYPES[@]}"; do
    EMAIL="test_${TYPE}_${TIMESTAMP}@vmarket.com"
    PASSWORD="TestPass123!"
    DISPLAY_NAME="Test ${TYPE^} User"
    
    echo -e "${YELLOW}Testing: ${TYPE}${NC}"
    echo "  Email: ${EMAIL}"
    echo "  Display Name: ${DISPLAY_NAME}"
    
    # Send signup request
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${EMAIL}\",
            \"password\": \"${PASSWORD}\",
            \"displayName\": \"${DISPLAY_NAME}\",
            \"userType\": \"${TYPE}\"
        }")
    
    # Extract HTTP status code (last line)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    # Extract response body (all but last line)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Check if successful (201 Created or 200 OK)
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo -e "  ${GREEN}✓ SUCCESS${NC} (HTTP ${HTTP_CODE})"
        
        # Try to extract user ID from response
        USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ ! -z "$USER_ID" ]; then
            echo "  User ID: ${USER_ID:0:8}..."
        fi
        
        ((PASS++))
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP ${HTTP_CODE})"
        echo "  Response: ${BODY}"
        ((FAIL++))
    fi
    echo ""
done

# Summary
echo "========================================="
echo "Summary:"
echo -e "${GREEN}Passed: ${PASS}${NC}"
echo -e "${RED}Failed: ${FAIL}${NC}"
echo "========================================="

# Exit with error code if any failed
if [ $FAIL -gt 0 ]; then
    exit 1
fi

exit 0
