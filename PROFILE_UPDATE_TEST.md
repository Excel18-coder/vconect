# 🧪 Profile Update Functionality Test Guide

## ✅ Current Implementation Status

### Backend Implementation ✅
All profile update functionality is properly implemented:

1. **Route**: `PUT /api/profile` ✅
2. **Controller**: `profileController.updateProfile` ✅
3. **Service**: `profileService.updateProfile` ✅
4. **Repository**: `profileRepository.update` ✅
5. **Authentication**: `authenticateToken` middleware ✅
6. **Validation**: `validateProfileUpdate` middleware ✅

### Frontend Implementation ✅
1. **API Service**: `profileAPI.updateProfile` ✅
2. **Auth Hook**: `useAuth.updateProfile` ✅
3. **Account Page**: Profile edit form ✅
4. **State Management**: React state with useEffect ✅

---

## 🔧 How Profile Update Works

### Backend Flow:
```
1. User sends PUT request to /api/profile with updates
2. authenticateToken middleware validates JWT token
3. validateProfileUpdate middleware validates input data
4. profileController.updateProfile receives request
5. profileService.updateProfile processes business logic
6. profileRepository.update executes SQL UPDATE
7. Updated profile returned to frontend
```

### Frontend Flow:
```
1. User clicks "Edit Profile" in Account page
2. Form fields become editable
3. User modifies: display_name, bio, phone_number, location, user_type
4. User clicks "Save Changes"
5. handleUpdateProfile() prepares update data
6. useAuth.updateProfile() calls profileAPI.updateProfile()
7. Backend processes request
8. Success/error toast displayed
9. Profile state updated in React
10. Form switches back to view mode
```

---

## 📝 Updateable Fields

### Required Fields:
- ✅ **display_name**: User's display name (min 2 characters)
- ✅ **user_type**: buyer, seller, landlord, driver, doctor, tutor, employer

### Optional Fields:
- ✅ **bio**: About the user (can be empty/null)
- ✅ **phone_number**: Contact phone (can be empty/null)
- ✅ **location**: User location (can be empty/null)

### Non-Updateable Fields:
- ❌ **id**: Profile ID
- ❌ **user_id**: User ID  
- ❌ **avatar_url**: Updated via separate endpoint
- ❌ **created_at**: Timestamp
- ❌ **updated_at**: Auto-updated by database

---

## 🧪 Manual Testing Steps

### Test 1: Update Display Name ✅
```bash
# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Save the token from response
TOKEN="your_jwt_token_here"

# Update display name
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "display_name": "John Updated Doe"
  }'

# Expected: 200 OK with updated profile
```

### Test 2: Update Multiple Fields ✅
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "display_name": "John Doe",
    "bio": "I am a software developer",
    "phone_number": "+254712345678",
    "location": "Nairobi, Kenya",
    "user_type": "seller"
  }'

# Expected: 200 OK with all fields updated
```

### Test 3: Clear Optional Fields ✅
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "bio": "",
    "phone_number": "",
    "location": ""
  }'

# Expected: 200 OK with optional fields set to null
```

### Test 4: Invalid Display Name ❌
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "display_name": "A"
  }'

# Expected: 400 Bad Request
# Error: "Display name must be at least 2 characters long"
```

### Test 5: Empty Display Name ❌
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "display_name": ""
  }'

# Expected: 400 Bad Request
# Error: Validation error
```

### Test 6: No Valid Fields ❌
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "invalid_field": "value"
  }'

# Expected: 400 Bad Request
# Error: "No valid fields to update"
```

### Test 7: No Authentication ❌
```bash
curl -X PUT http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Hacker"
  }'

# Expected: 401 Unauthorized
# Error: "Access token required"
```

---

## 🎯 Frontend Testing (Browser)

### Test 1: Edit Profile Flow
1. Login to your account
2. Go to Account page (`/account`)
3. Click **"Edit Profile"** button
4. Modify any field (display_name, bio, phone, location)
5. Click **"Save Changes"**
6. ✅ **Expected**: 
   - Success toast message
   - Profile updates immediately
   - Form switches back to view mode
   - Changes persist on page refresh

### Test 2: Cancel Editing
1. Click **"Edit Profile"**
2. Modify some fields
3. Click **"Cancel"**
4. ✅ **Expected**:
   - Changes discarded
   - Original values restored
   - Form switches back to view mode

### Test 3: Required Field Validation
1. Click **"Edit Profile"**
2. Clear the display name field
3. Click **"Save Changes"**
4. ✅ **Expected**:
   - Error toast: "Display name is required"
   - Form stays in edit mode
   - No API call made

### Test 4: Update Phone Number for WhatsApp
1. Edit profile
2. Add/update phone number (e.g., +254712345678)
3. Save changes
4. Create a product listing
5. View product detail page
6. ✅ **Expected**:
   - Phone number shows on seller contact
   - WhatsApp button works with this number

---

## 🔍 Debugging Profile Updates

### Check Database Updates:
```sql
-- Connect to Neon PostgreSQL
-- Check profiles table
SELECT * FROM profiles WHERE user_id = 'your_user_id';

-- Check recent updates
SELECT * FROM profiles 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

### Check Backend Logs:
```bash
# In your backend logs, look for:
[DEBUG] Getting user profile { userId: '...' }
[DEBUG] Updating user profile { userId: '...', updateData: {...} }
[INFO] Profile updated successfully { userId: '...', updatedFields: [...] }
```

### Check Frontend Network:
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Edit and save profile
4. Look for:
   - **Request**: `PUT /api/profile`
   - **Status**: `200 OK`
   - **Response**: `{success: true, data: {profile: {...}}}`

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Profile not found"
**Cause**: User doesn't have a profile in database
**Solution**: 
```sql
-- Create profile for user
INSERT INTO profiles (user_id, display_name, user_type)
VALUES ('user_id_here', 'Default Name', 'buyer');
```

### Issue 2: "No valid fields to update"
**Cause**: Frontend sending wrong field names
**Solution**: Ensure field names match backend:
- `display_name` (not `displayName`)
- `phone_number` (not `phoneNumber`)
- `user_type` (not `userType`)

### Issue 3: Updates don't persist
**Cause**: Frontend not refreshing profile state
**Solution**: Check `updateProfile` in useAuth.tsx:
```typescript
if (response.data?.profile) {
  setProfile(response.data.profile); // Must update state
}
```

### Issue 4: "Access token required"
**Cause**: Token not being sent or expired
**Solution**: 
1. Check localStorage for token
2. Login again if expired
3. Verify authFetch includes Authorization header

### Issue 5: Phone number doesn't show on products
**Cause**: Contact phone not syncing from profile
**Solution**: When creating products, check if contact_phone is being populated from profile.phone_number

---

## ✅ Verification Checklist

After updating profile, verify:

- [ ] Display name updated in profile page
- [ ] Display name updated in header/navigation
- [ ] Bio updated and displays correctly
- [ ] Phone number updated
- [ ] Location updated
- [ ] User type updated (buyer/seller/etc.)
- [ ] Avatar still displays correctly
- [ ] Changes persist after page refresh
- [ ] Changes persist after logout/login
- [ ] Updated phone shows on product listings
- [ ] WhatsApp button uses updated phone
- [ ] Success toast displayed
- [ ] No console errors
- [ ] Database record updated (check SQL)

---

## 🚀 Production Deployment Checklist

Before deploying profile update feature:

### Backend:
- [ ] Environment variables set in Render
- [ ] Database migrations run (profiles table exists)
- [ ] JWT secrets configured
- [ ] CORS includes frontend URL
- [ ] Rate limiting configured
- [ ] Error logging enabled

### Frontend:
- [ ] API_BASE_URL points to production backend
- [ ] Token storage working
- [ ] Auth context providing updateProfile
- [ ] Toast notifications styled
- [ ] Form validation working
- [ ] Loading states implemented

---

## 📊 Expected Behavior Summary

### ✅ What Should Work:
1. User can edit display name, bio, phone, location, user_type
2. Changes save successfully to database
3. UI updates immediately after save
4. Success notification displayed
5. Form validation prevents invalid data
6. Optional fields can be cleared
7. Phone number propagates to product listings
8. WhatsApp integration uses updated phone
9. Changes persist across sessions
10. Multiple users can update independently

### ❌ What Should Not Work:
1. Updating without authentication
2. Setting display name to empty/too short
3. Setting invalid user_type
4. Updating other users' profiles
5. Modifying read-only fields (id, created_at)
6. SQL injection via input fields
7. XSS attacks via bio/name fields

---

## 📞 Support Information

### If Profile Updates Fail:

1. **Check Backend Logs** (Render Dashboard → Logs)
2. **Check Frontend Console** (Browser DevTools)
3. **Verify Database Schema**:
   ```sql
   \d profiles  -- PostgreSQL
   ```
4. **Test API Directly** (use curl commands above)
5. **Check Authentication** (token valid and not expired)

### Common Error Codes:
- `400`: Validation error (check input data)
- `401`: Unauthorized (login again)
- `404`: Profile not found (create profile first)
- `500`: Server error (check backend logs)

---

**Last Updated**: November 4, 2025
**Status**: ✅ Fully Implemented and Working
**Test Coverage**: Backend + Frontend + Integration
