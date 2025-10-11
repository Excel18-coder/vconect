# V-Market Backend API

A comprehensive Node.js/Express backend for V-Market - Kenya's Digital Marketplace. This API provides authentication, user management, file uploads, and marketplace functionality using Neon (Postgres) for database and Cloudinary for image storage.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Email verification
  - Password reset functionality
  - Role-based access control
  - Session management

- **User Management**
  - User registration and login
  - Profile management with customizable fields
  - Avatar and image uploads
  - Public profile viewing

- **File Management**
  - Cloudinary integration for image storage
  - Image transformation and optimization
  - Multiple file upload support
  - Secure file deletion

- **Security**
  - Rate limiting
  - Input validation
  - SQL injection prevention
  - CORS protection
  - Helmet security headers

## 📋 Prerequisites

- Node.js 18+ 
- Neon (Postgres) database
- Cloudinary account

## 🔧 Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables in `.env`:**
   ```env
   # Database (Neon)
   DATABASE_URL=postgresql://username:password@hostname/database_name?sslmode=require

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your_refresh_token_secret_here
   JWT_REFRESH_EXPIRES_IN=30d

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Server
   NODE_ENV=development
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Database Setup:**
   ```bash
   # Run migrations to create tables
   npm run migrate

   # Seed initial data (categories)
   npm run seed
   ```

6. **Start the server:**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh-token` | Refresh access token | No |
| GET | `/verify-email/:token` | Verify email address | No |
| POST | `/request-password-reset` | Request password reset | No |
| POST | `/reset-password` | Reset password | No |
| GET | `/me` | Get current user info | Yes |
| POST | `/logout` | Logout user | Yes |
| POST | `/logout-all` | Logout from all devices | Yes |

### Profile Management (`/api/profile`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get current user profile | Yes |
| PUT | `/` | Update profile | Yes |
| PATCH | `/avatar` | Update avatar URL | Yes |
| GET | `/search` | Search profiles | No |
| GET | `/:userId` | Get public profile | No |

### File Upload (`/api/upload`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/avatar` | Upload avatar image | Yes |
| POST | `/listing-images` | Upload multiple listing images | Yes |
| DELETE | `/image/:publicId` | Delete image | Yes |
| GET | `/transform/:publicId` | Get transformed image URL | Yes |
| POST | `/signature` | Get upload signature | Yes |

### Utility Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |
| GET | `/api` | API information | No |
| GET | `/` | Welcome message | No |

## 📊 Database Schema

### Users Table
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- email_verified (BOOLEAN)
- verification_token (VARCHAR)
- reset_password_token (VARCHAR)
- reset_password_expires (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Profiles Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- display_name (VARCHAR)
- avatar_url (TEXT)
- bio (TEXT)
- user_type (ENUM: buyer, seller, landlord, employer, doctor, tutor, admin)
- phone_number (VARCHAR)
- location (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔒 Authentication Flow

1. **Registration:**
   ```bash
   POST /api/auth/register
   {
     "email": "user@example.com",
     "password": "SecurePassword123",
     "displayName": "John Doe"
   }
   ```

2. **Login:**
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "SecurePassword123"
   }
   ```

3. **Use Access Token:**
   ```bash
   Authorization: Bearer <access_token>
   ```

4. **Refresh Token:**
   ```bash
   POST /api/auth/refresh-token
   {
     "refreshToken": "<refresh_token>"
   }
   ```

## 📁 File Upload Examples

### Upload Avatar
```bash
POST /api/upload/avatar
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

Form Data:
- image: <file>
```

### Upload Multiple Images
```bash
POST /api/upload/listing-images
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

Form Data:
- images: <file1>
- images: <file2>
- images: <file3>
```

## 🛡️ Security Features

- **Rate Limiting:** Different limits for different endpoint types
- **Input Validation:** Comprehensive validation using express-validator
- **SQL Injection Prevention:** Using parameterized queries with Neon
- **Password Hashing:** bcrypt with configurable salt rounds
- **JWT Security:** Separate access and refresh tokens
- **CORS Protection:** Configurable origin whitelist
- **Helmet:** Security headers for Express

## 🔄 Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-10-01T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ],
  "timestamp": "2025-10-01T10:00:00.000Z"
}
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","displayName":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=<neon_production_url>
JWT_SECRET=<strong_production_secret>
CLOUDINARY_CLOUD_NAME=<production_cloud_name>
CORS_ORIGIN=https://your-frontend-domain.com
```

### Scripts
```bash
npm run migrate    # Run database migrations
npm run seed      # Seed initial data
npm start         # Start production server
npm run dev       # Start development server
```

## 🤝 Frontend Integration

The backend is designed to work seamlessly with the React frontend. Update your frontend API calls to use the new endpoints:

### Example Frontend API Service
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Authentication
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Profile
const updateProfile = async (profileData, token) => {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.
