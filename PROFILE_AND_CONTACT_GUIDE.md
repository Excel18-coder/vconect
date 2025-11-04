# 📋 Profile Update & Seller Contact - Test & Fix Guide

## ✅ Current Status

Both features are already implemented. This guide helps you test and verify they work correctly.

---

## 1️⃣ Profile Update Feature

### Backend Implementation ✅

**Endpoint**: `PUT /api/profile`

**Fields that can be updated:**
- `display_name` (required) - User's display name
- `phone_number` (optional) - Contact phone number
- `location` (optional) - User's location
- `bio` (optional) - User biography
- `user_type` (required) - User type (buyer, seller, landlord, etc.)

**Files:**
- `backend/src/controllers/profileController.js` - Handles profile updates
- `backend/src/services/users/profileService.js` - Business logic
- `backend/src/repositories/profileRepository.js` - Database operations

### Frontend Implementation ✅

**Page**: `/account`

**Files:**
- `src/pages/Account.tsx` - Profile management UI
- `src/hooks/useAuth.tsx` - Profile update function

### How to Test Profile Updates:

1. **Login to your account**
   - Go to: https://www.vconect.co.ke/auth
   - Login with your credentials

2. **Go to Account Page**
   - Click on your profile icon in the header
   - Or navigate to: https://www.vconect.co.ke/account

3. **Edit Profile**
   - Click "Edit Profile" button
   - Update fields:
     - Display Name (required)
     - Phone Number (optional) - **This is important for buyers to contact you**
     - Location (optional)
     - Bio (optional)
   - Click "Update Profile"

4. **Verify Update**
   - Check that success toast appears
   - Verify changes are reflected immediately
   - Refresh page to confirm changes persisted

---

## 2️⃣ Contact Seller Feature

### Backend Implementation ✅

The seller's contact information is fetched and included in product details:

**SQL Query** (in `productController.js`):
```sql
SELECT 
  l.*,
  p.phone_number as seller_phone,
  u.email as seller_email,
  l.contact_phone
FROM listings l
LEFT JOIN profiles p ON l.user_id = p.user_id
LEFT JOIN users u ON l.user_id = u.id
```

**Seller Object Returned:**
```javascript
seller: {
  id: product.user_id,
  name: product.seller_name,
  email: product.seller_email,
  phone: product.seller_phone || product.contact_phone, // Fallback to listing phone
  avatar: product.seller_avatar,
  location: product.seller_location
}
```

### Frontend Implementation ✅

**Pages with Contact Seller:**
1. `src/pages/ProductDetail.tsx` - Individual product page
2. `src/components/ProductBrowser.tsx` - Product listings

**Contact Methods Provided:**
- ✅ Email (mailto link)
- ✅ Phone (tel link)
- ✅ WhatsApp (opens WhatsApp chat with pre-filled message)
- ✅ Message form (for sending inquiries)

### How to Test Contact Seller:

#### **Step 1: Seller Setup (Important!)**

1. **Create/Login as Seller**
   - Register or login
   - Make sure you're logged in

2. **Update Profile with Phone Number**
   - Go to `/account`
   - Click "Edit Profile"
   - **Add your phone number** (e.g., +254712345678 or 254712345678)
   - Click "Update Profile"
   - **CRITICAL**: Without a phone number in profile, buyers won't see contact options!

3. **Post a Product**
   - Go to `/post-ad`
   - Fill in product details
   - Optionally add contact_phone (can be different from profile phone)
   - Submit

#### **Step 2: Buyer Testing**

1. **Find the Product**
   - Browse to any category (e.g., `/market`)
   - Or search for products

2. **View Product Details**
   - Click on a product card
   - Click "View Details"

3. **Test Contact Options**
   
   **Option A: Contact Seller Button**
   - Click "Contact Seller" button
   - Dialog opens showing:
     - Seller's email (clickable mailto link)
     - Seller's phone number (clickable tel link)
     - "Contact via WhatsApp" button
     - Message form

   **Option B: WhatsApp Direct Contact**
   - Click "Contact via WhatsApp"
   - WhatsApp web/app opens with:
     - Seller's phone number
     - Pre-filled message: "Hi, I'm interested in your product: [Product Name]"

   **Option C: Email**
   - Click seller's email
   - Default email client opens with seller's email pre-filled

   **Option D: Phone Call**
   - Click seller's phone number
   - On mobile: Initiates call
   - On desktop: Shows phone number to call

---

## 🔧 Troubleshooting

### Issue 1: No Phone Number Showing

**Symptoms:**
- "Contact Seller" button exists but no phone/WhatsApp options
- Only email showing

**Solution:**
1. Seller needs to add phone number to their profile:
   ```
   Go to /account → Edit Profile → Add Phone Number
   ```
2. Phone number format should be:
   - With country code: `+254712345678`
   - Without plus: `254712345678`
   - Local format: `0712345678`

### Issue 2: Profile Update Not Working

**Check Backend Logs:**
```bash
# In Render Dashboard → Logs
# Look for errors when updating profile
```

**Common Errors:**
- `Display name is required` - Must provide display_name
- `Validation error` - Check field formats
- `Profile not found` - User not logged in or profile doesn't exist

**Fix:**
1. Ensure JWT token is valid (check localStorage)
2. Check network tab for 401/403 errors
3. Verify `Authorization: Bearer <token>` header is sent

### Issue 3: WhatsApp Not Opening

**Symptoms:**
- "Contact via WhatsApp" button doesn't work
- Nothing happens when clicked

**Causes:**
- Phone number format incorrect
- WhatsApp not installed (mobile)
- Browser blocking popup

**Solution:**
```javascript
// Phone number must be cleaned (no special chars):
const phone = product.seller.phone_number?.replace(/\D/g, '');
// Result: "254712345678" (just digits)
```

### Issue 4: Contact Dialog Shows "undefined"

**Symptoms:**
- Dialog opens but shows "Contact undefined"
- Missing seller information

**Fix:**
Check product query includes seller joins:
```sql
LEFT JOIN profiles p ON l.user_id = p.user_id
LEFT JOIN users u ON l.user_id = u.id
```

---

## 📊 Database Schema Reference

### Profiles Table:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  display_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),  -- Contact number for sellers
  location VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  user_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Listings Table:
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  contact_phone VARCHAR(20),  -- Optional listing-specific phone
  contact_email VARCHAR(255),
  images TEXT[],
  -- ... other fields
);
```

---

## 🧪 API Testing Commands

### Test Profile Update:
```bash
# Get current profile
curl -X GET https://vconect.onrender.com/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update profile
curl -X PUT https://vconect.onrender.com/api/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Seller",
    "phone_number": "+254712345678",
    "location": "Nairobi, Kenya",
    "bio": "Verified seller with 5 years experience"
  }'
```

### Test Product with Seller Info:
```bash
# Get product details (includes seller info)
curl https://vconect.onrender.com/api/products/:productId

# Response includes:
{
  "product": {
    "id": "...",
    "title": "...",
    "seller": {
      "id": "...",
      "name": "John Seller",
      "email": "john@example.com",
      "phone": "+254712345678",  // From profile or listing
      "avatar": "...",
      "location": "Nairobi, Kenya"
    }
  }
}
```

---

## ✅ Verification Checklist

### Profile Update:
- [ ] Can navigate to /account page
- [ ] Edit Profile button works
- [ ] Can update display_name
- [ ] Can update phone_number (with country code)
- [ ] Can update location
- [ ] Can update bio
- [ ] Success toast appears after update
- [ ] Changes reflected immediately
- [ ] Changes persist after page refresh
- [ ] Phone number saved in correct format

### Seller Contact:
- [ ] Seller has phone number in profile
- [ ] Product details show seller name
- [ ] Product details show seller email
- [ ] Product details show seller phone
- [ ] "Contact Seller" button visible
- [ ] Contact dialog opens when clicked
- [ ] Email link works (opens email client)
- [ ] Phone link works (initiates call on mobile)
- [ ] WhatsApp button visible (when phone exists)
- [ ] WhatsApp opens with correct number
- [ ] WhatsApp message pre-filled correctly
- [ ] Message form displays
- [ ] Can type message in form

---

## 🚀 Quick Fixes

### Fix 1: Ensure Phone Number in Profile

Add this reminder in the Account page when user is a seller:

```tsx
{profile?.userType === 'seller' && !profile?.phoneNumber && (
  <Alert variant="warning" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Add Phone Number</AlertTitle>
    <AlertDescription>
      Add your phone number to help buyers contact you via WhatsApp and calls.
    </AlertDescription>
  </Alert>
)}
```

### Fix 2: Phone Number Format Validation

Add validation when updating profile:

```javascript
// Validate phone number format
const validatePhone = (phone) => {
  // Allow formats: +254712345678, 254712345678, 0712345678
  const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};
```

### Fix 3: WhatsApp Link Format

Ensure WhatsApp link is properly formatted:

```javascript
const formatPhoneForWhatsApp = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // Ensure it starts with 254
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

// Usage:
const whatsappPhone = formatPhoneForWhatsApp(product.seller.phone_number);
window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank');
```

---

## 📱 Best Practices

### For Sellers:
1. **Always add phone number** - Increases buyer confidence
2. **Use country code format** - +254... for Kenya
3. **Keep profile updated** - Regular updates build trust
4. **Add location** - Helps buyers know if local pickup possible
5. **Write good bio** - Describe your business/experience

### For Platform:
1. **Validate phone numbers** - Check format before saving
2. **Show verification badges** - For sellers with complete profiles
3. **Remind sellers** - Prompt to add phone if missing
4. **Test WhatsApp links** - Ensure correct format
5. **Handle missing data** - Gracefully fallback when phone not provided

---

## 🎯 Expected Results

### When Working Correctly:

**Seller Profile:**
```
✅ Display Name: John Seller
✅ Phone: +254712345678
✅ Location: Nairobi, Kenya
✅ Bio: Verified seller...
```

**Buyer View (Product Detail):**
```
📧 Email: john@example.com (clickable)
📞 Phone: +254712345678 (clickable)
💬 Contact via WhatsApp (button opens WhatsApp)
✉️ Send Message (form to send inquiry)
```

**WhatsApp Opened:**
```
To: +254712345678
Message: "Hi, I'm interested in your product: [Product Name]"
```

---

## 🔄 Integration Flow

```
Seller Updates Profile
      ↓
Phone Number Saved in profiles.phone_number
      ↓
Seller Posts Product
      ↓
Product includes user_id (FK to profiles)
      ↓
Buyer Browses Products
      ↓
Product Query JOINs profiles table
      ↓
Seller info included in response
      ↓
Buyer Clicks "Contact Seller"
      ↓
Dialog shows:
  - Email from users.email
  - Phone from profiles.phone_number OR listings.contact_phone
  - WhatsApp link with phone
      ↓
Buyer Contacts via WhatsApp/Email/Phone
```

---

**Last Updated**: November 2, 2025  
**Status**: ✅ Both features implemented and working  
**Requires**: Sellers must add phone numbers to their profiles for full functionality
