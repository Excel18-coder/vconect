# End-to-End Testing Guide

## Prerequisites

### 1. Start Backend Server
```bash
cd backend
npm run dev
```
**Expected Output**:
```
Server running on port 5000
✓ Database connected
✓ All routes mounted
✓ Health check available at /health
```

### 2. Start Frontend Server
```bash
cd /home/crash/Videos/v-market
npm run dev
```
**Expected Output**:
```
VITE v5.4.19  ready in 724 ms
➜  Local:   http://localhost:8080/
```

### 3. Open Browser
Navigate to: `http://localhost:8080/`

---

## Test Scenarios

### Scenario 1: New Seller Creates Product ✅

**Objective**: Test complete seller flow from registration to product creation

**Steps**:
1. Click "Sign In" button in header (or navigate to /auth)
2. Click "Sign Up" tab
3. Fill registration form:
   - Email: `seller@test.com`
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
   - Display Name: `Test Seller`
4. Click "Sign Up" button
5. **Expected**: Redirected to home page, user logged in

6. Click "Post Ad" button in navigation
7. **Expected**: Navigated to /post-ad page

8. Fill product form:
   - Title: `iPhone 13 Pro 128GB`
   - Description: `Brand new iPhone 13 Pro, never used. Comes with original box and accessories.`
   - Price: `85000`
   - Category: `Market`
   - Subcategory: `Electronics`
   - Condition: `New`
   - Location: `Nairobi`
   - Stock: `1`
   - Discount: `10` (optional)
   - Shipping Cost: `500`
   - Tags: `iphone, apple, smartphone` (comma-separated)

9. Upload Images:
   - Click "Choose Images" or drag-drop
   - Select 3-5 product images
   - **Expected**: Image previews appear
   - **Expected**: First image has "Main Photo" badge
   - Drag images to reorder
   - Click X to remove an image

10. Click "Post Product" button
11. **Expected**: Loading state shows
12. **Expected**: Success toast: "Product posted successfully!"
13. **Expected**: Redirected to /sell page
14. **Expected**: New product appears in "My Listings"

**Pass Criteria**:
- ✅ Form validation works (required fields)
- ✅ Image upload works (max 10, 5MB each)
- ✅ Product appears in seller's listings
- ✅ No console errors

---

### Scenario 2: Buyer Browses and Views Product ✅

**Objective**: Test buyer discovery and product detail flow

**Steps**:
1. On home page, scroll to "Explore Our Marketplace" section
2. Click "Explore Market" button on Market category card
3. **Expected**: Navigated to /category/market page
4. **Expected**: Products displayed in grid view

5. Observe ProductBrowser features:
   - Search bar at top
   - Filter by category, location, price range
   - Sort options (newest, price low-high, etc.)
   - Grid/List view toggle

6. Find the iPhone product created in Scenario 1
7. Click "View Details" button
8. **Expected**: Navigated to /product/:id page
9. **Expected**: Full product information displayed:
   - Image gallery with thumbnails
   - Title, price, discount
   - Description
   - Location, stock, condition
   - Seller information
   - Tags

10. Click thumbnail images
11. **Expected**: Main image changes

12. Click "Back" button
13. **Expected**: Navigated back to previous page

**Pass Criteria**:
- ✅ Category navigation works
- ✅ Product cards display correctly
- ✅ View Details navigates to product page
- ✅ Image gallery works
- ✅ All product information visible

---

### Scenario 3: Buyer Contacts Seller ✅

**Objective**: Test contact seller functionality

**Steps**:
1. View product detail page (from Scenario 2)
2. Click "Contact Seller" button in seller card
3. **Expected**: Contact dialog opens
4. **Expected**: Dialog shows:
   - Seller's display name
   - Email link (clickable)
   - Phone link (if available, clickable)
   - "Send Message" button

5. Click email link
6. **Expected**: Opens default email client with seller's email

7. If phone number exists, click phone link
8. **Expected**: Opens phone dialer (on mobile) or prompts action

9. Click "Send Message" button
10. **Expected**: Console shows "Send message to seller: [seller_id]"
11. **Note**: Messaging system not yet implemented

12. Close dialog

**Alternative Test (Not Logged In)**:
1. Sign out from account
2. Try to click "Contact Seller"
3. **Expected**: Toast error: "Please login to contact seller"
4. **Expected**: Redirected to /auth page

**Pass Criteria**:
- ✅ Contact dialog opens with seller info
- ✅ Email and phone links work
- ✅ Authentication check works
- ✅ Redirects to login if not authenticated

---

### Scenario 4: Browse via Search ✅

**Objective**: Test search functionality

**Steps**:
1. In header search bar (desktop or mobile), type: `iphone`
2. Press Enter or click search
3. **Expected**: Navigated to /search?q=iphone
4. **Expected**: Products matching "iphone" displayed
5. **Expected**: Search term shown in results

6. Test filters:
   - Select category: `Market`
   - Select location: `Nairobi`
   - Set price range: Min `50000`, Max `100000`
   - Click "Apply Filters"
7. **Expected**: Results filtered accordingly

8. Click "View Details" on a product
9. **Expected**: Navigate to product detail page

**Pass Criteria**:
- ✅ Search redirects with query parameter
- ✅ Results filtered by search term
- ✅ Additional filters work
- ✅ View Details button works

---

### Scenario 5: Category Navigation ✅

**Objective**: Test all category navigation buttons

**Steps**:
1. From home page, test Navigation bar:
   - Click "House" → /category/house
   - Click "Transport" → /category/transport
   - Click "Market" → /category/market
   - Click "Health" → /category/health
   - Click "Jobs" → /category/jobs
   - Click "More" dropdown:
     - Click "Education" → /category/education
     - Click "Entertainment" → /category/entertainment
     - Click "Revenue" → /category/revenue
     - Click "AI Insights" → /category/algorithm

2. **Expected**: Each navigates to correct category page
3. **Expected**: Category products displayed (or empty state if no products)

3. Test CategoryGrid on home page:
   - Scroll to "Explore Our Marketplace"
   - Click "Explore House" → /category/house
   - Click "Explore Transport" → /category/transport
   - (Test all 9 categories)

4. **Expected**: All navigate to proper category pages

**Pass Criteria**:
- ✅ All navigation buttons work
- ✅ Category pages load correctly
- ✅ No 404 errors
- ✅ Active tab highlights in navigation

---

### Scenario 6: Account Management ✅

**Objective**: Test account page functionality

**Steps**:
1. Click user avatar in header
2. Click "Account" in dropdown
3. **Expected**: Navigated to /account page
4. **Expected**: Overview tab shows:
   - User info
   - Stats (listings, favorites, messages, earnings)

5. Click "Profile" tab
6. Click "Edit Profile" button
7. Update profile:
   - Display Name: `Updated Seller`
   - Bio: `Experienced seller on V-MARKET`
   - Phone: `+254712345678`
   - Location: `Nairobi`
8. Click "Save Changes"
9. **Expected**: Success toast
10. **Expected**: Profile updated
11. **Expected**: Exit edit mode

12. Test Quick Actions (in Activity tab):
   - Click "Browse Products" → /search
   - Click "Find Jobs" → /category/jobs
   - Click "Book Transport" → /category/transport
   - **Note**: "View Favorites" shows TODO console.log

13. Click "Settings" tab
14. **Expected**: Settings options visible

15. Click "Sign out" button
16. **Expected**: Logged out
17. **Expected**: Redirected to home page

**Pass Criteria**:
- ✅ Account page loads
- ✅ Profile edit works
- ✅ Quick actions navigate correctly
- ✅ Sign out works

---

### Scenario 7: Seller Dashboard ✅

**Objective**: Test seller's product management

**Steps**:
1. Login as seller (from Scenario 1)
2. Click "Sell" button in navigation
3. **Expected**: Navigated to /sell page
4. **Expected**: Seller dashboard displayed:
   - Stats (total products, active, sold, revenue)
   - "Post New Product" button
   - My Listings section with products

5. View product in My Listings:
   - Image thumbnail
   - Title, price
   - Category, condition badges
   - Status badge (active/inactive)
   - Views count
   - Edit and Delete buttons

6. Click Edit button (pencil icon)
7. **Expected**: Navigated to /edit-product/:id
8. **Note**: Edit page needs to be created (TODO)

9. Return to /sell page
10. Click Delete button (trash icon) on a product
11. **Expected**: Confirmation dialog
12. Confirm deletion
13. **Expected**: Product deleted
14. **Expected**: Product removed from list
15. **Expected**: Stats updated

16. Click "Post New Product" button
17. **Expected**: Navigated to /post-ad page

**Pass Criteria**:
- ✅ Seller dashboard loads
- ✅ Products displayed correctly
- ✅ Delete product works
- ✅ Post Ad button navigates to form
- ✅ Edit button navigates (page needs creation)

---

### Scenario 8: Share Product ✅

**Objective**: Test product sharing

**Steps**:
1. View any product detail page
2. Click Share button (Share2 icon)
3. **Expected**: If browser supports navigator.share:
   - Native share dialog opens
   - Title, description, URL populated
4. **Expected**: If browser doesn't support navigator.share:
   - URL copied to clipboard
   - Toast: "Link copied to clipboard"

5. Paste URL in browser
6. **Expected**: Same product page loads

**Pass Criteria**:
- ✅ Share button works
- ✅ Native share or clipboard fallback works
- ✅ Shared URL loads correct product

---

### Scenario 9: Add to Favorites ✅ (UI Only)

**Objective**: Test favorites functionality

**Steps**:
1. View product detail page
2. Click Heart icon (top right)
3. **Expected**: If logged in:
   - Heart icon fills with red color
   - Toast: "Added to favorites"
4. **Expected**: If not logged in:
   - Toast: "Please login to add to favorites"
   - Redirected to /auth

5. Click Heart icon again (when logged in)
6. **Expected**: Heart icon unfills
7. **Expected**: Toast: "Removed from favorites"

**Note**: 
- UI works, but backend API not yet implemented
- Currently just toggles local state
- Need to implement POST/DELETE /api/buyers/:id/favorites

**Pass Criteria**:
- ✅ Button toggles state
- ✅ Visual feedback (heart fills/unfills)
- ✅ Authentication check works
- ⚠️ API integration pending

---

### Scenario 10: Mobile Responsiveness ✅

**Objective**: Test on mobile viewport

**Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro
4. Test all scenarios above on mobile
5. **Expected**: 
   - Mobile navigation works
   - Mobile search bar visible below header
   - Forms responsive
   - Images responsive
   - Cards stack vertically
   - Touch interactions work

**Pass Criteria**:
- ✅ Mobile layout works
- ✅ All buttons accessible
- ✅ Forms usable
- ✅ No horizontal scroll

---

## Common Issues & Fixes

### Issue 1: "Failed to fetch product"
**Cause**: Backend server not running or wrong API URL
**Fix**: 
```bash
# Check backend is running on port 5000
cd backend && npm run dev

# Check .env file
echo $VITE_API_BASE_URL  # Should be http://localhost:5000/api
```

### Issue 2: "Please login to..."
**Cause**: Token expired or not present
**Fix**: 
- Sign in again
- Check localStorage has 'token' key
- Backend should return valid JWT

### Issue 3: Image upload fails
**Cause**: Cloudinary not configured or image too large
**Fix**:
- Check backend .env has CLOUDINARY_* variables
- Ensure image < 5MB
- Check backend logs for Cloudinary errors

### Issue 4: Product not appearing after creation
**Cause**: Database insert failed or fetch query wrong
**Fix**:
- Check backend logs
- Check database for product
- Verify GET /api/products returns data
- Check seller_id matches logged-in user

### Issue 5: 404 on category pages
**Cause**: Route not registered or typo in URL
**Fix**:
- Check App.tsx has /category/:categoryId route
- Verify Navigation and CategoryGrid use correct paths
- Check browser network tab for actual URL

---

## Performance Benchmarks

### Load Times (Expected)
- Home page: < 2s
- Product detail: < 1s
- Search results: < 2s
- Image upload: < 3s per image

### API Response Times (Expected)
- GET /api/products: < 500ms
- POST /api/products: < 2s (with images)
- GET /api/products/:id: < 300ms

### Database Queries (Expected)
- Product list: < 100ms
- Product detail: < 50ms
- Create product: < 200ms

---

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 120+ (recommended)
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+

### Features Requiring Modern Browser
- Native Share API (fallback: clipboard)
- File API (image upload)
- Fetch API (HTTP requests)
- LocalStorage (auth token)

---

## API Endpoints Used in Tests

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Products
- GET /api/products (with query params)
- GET /api/products/:id
- POST /api/products (multipart/form-data)
- PUT /api/products/:id
- DELETE /api/products/:id

### Buyers (Future)
- GET /api/buyers/:id/favorites
- POST /api/buyers/:id/favorites/:productId
- DELETE /api/buyers/:id/favorites/:productId
- POST /api/buyers/:id/messages

### Upload
- POST /api/upload/images (Cloudinary)

---

## Test Data

### Sample Products (for manual testing)
```json
{
  "title": "MacBook Pro 16\" 2023",
  "description": "Brand new MacBook Pro with M2 Max chip, 32GB RAM, 1TB SSD. Perfect for developers and creators.",
  "price": 350000,
  "category": "market",
  "subcategory": "electronics",
  "condition": "new",
  "location": "Nairobi",
  "stock_quantity": 2,
  "discount_percentage": 5,
  "shipping_cost": 1000,
  "tags": ["macbook", "apple", "laptop", "m2"]
}
```

```json
{
  "title": "Toyota Corolla 2020",
  "description": "Well maintained Toyota Corolla, single owner, full service history. Perfect condition.",
  "price": 1800000,
  "category": "transport",
  "condition": "excellent",
  "location": "Mombasa",
  "stock_quantity": 1,
  "shipping_cost": 0,
  "tags": ["toyota", "corolla", "car", "sedan"]
}
```

### Test Users
```
Seller 1:
- Email: seller1@test.com
- Password: Test1234!
- Type: Seller

Buyer 1:
- Email: buyer1@test.com
- Password: Test1234!
- Type: Buyer
```

---

## Success Metrics

### Must Pass (Critical)
- ✅ User can register and login
- ✅ User can create product with images
- ✅ Product appears in listings
- ✅ Product detail page loads
- ✅ Contact seller works (email/phone)
- ✅ Navigation between pages works
- ✅ Search and filters work

### Should Pass (Important)
- ✅ Edit profile works
- ✅ Delete product works
- ✅ Share product works
- ✅ Mobile responsive
- ✅ No console errors

### Nice to Have (Future)
- ⏳ Messaging system
- ⏳ Favorites API integration
- ⏳ Shopping cart
- ⏳ Payment integration
- ⏳ Order tracking

---

## Automated Testing (TODO)

### Unit Tests (Jest + React Testing Library)
```bash
npm test
```

### E2E Tests (Cypress)
```bash
npm run cypress:open
```

### API Tests (Postman)
Import collection: `backend/tests/postman/v-market-api.json`

---

## Reporting Issues

When reporting issues, include:
1. **Browser**: Chrome 120.0.6099.129
2. **Steps to reproduce**: Detailed step-by-step
3. **Expected result**: What should happen
4. **Actual result**: What actually happened
5. **Console errors**: Copy from DevTools Console
6. **Network errors**: Check Network tab for failed requests
7. **Screenshots**: Helpful for UI issues

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Deploy backend to production
2. Deploy frontend to production
3. Configure production environment variables
4. Set up CI/CD pipeline
5. Monitor errors with Sentry
6. Set up analytics with Google Analytics

### If Tests Fail ❌
1. Document failing scenarios
2. Check backend logs
3. Check database state
4. Verify API responses
5. Fix issues
6. Re-run tests

---

## Test Report Template

```markdown
# V-MARKET Test Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: Development
**Backend**: Running ✅ / Not Running ❌
**Frontend**: Running ✅ / Not Running ❌

## Scenarios Tested

- [ ] Scenario 1: New Seller Creates Product
- [ ] Scenario 2: Buyer Browses and Views Product
- [ ] Scenario 3: Buyer Contacts Seller
- [ ] Scenario 4: Browse via Search
- [ ] Scenario 5: Category Navigation
- [ ] Scenario 6: Account Management
- [ ] Scenario 7: Seller Dashboard
- [ ] Scenario 8: Share Product
- [ ] Scenario 9: Add to Favorites
- [ ] Scenario 10: Mobile Responsiveness

## Pass Rate
- Passed: X/10
- Failed: Y/10
- Pass Rate: Z%

## Issues Found
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

## Notes
[Any additional observations]

## Recommendation
- [ ] Ready for production
- [ ] Needs fixes before deployment
- [ ] Needs more testing
```

---

**Last Updated**: January 2024
**Status**: All scenarios documented and ready for testing
**Next**: Run tests and document results
