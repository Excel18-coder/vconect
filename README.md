# V-MARKET - Kenya's Digital Marketplace

## Project info

**V-Market** is a modern digital marketplace built for Kenya, connecting buyers and sellers across various categories including education, entertainment, health, jobs, transport, and more.

## 🏗️ Architecture

This is a full-stack application with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + Neon (Postgres) + Cloudinary
- **Authentication**: JWT-based auth with refresh tokens
- **File Storage**: Cloudinary for image uploads and transformations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Neon (Postgres) database account
- Cloudinary account

### One-Command Setup
```bash
./start.sh
```

This script will:
1. Install all dependencies (frontend + backend)
2. Set up environment files
3. Run database migrations
4. Start both servers

### Manual Setup

#### 1. Clone and Install
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Environment Configuration

**Backend (.env in backend/ directory):**
```env
DATABASE_URL=postgresql://username:password@hostname/database_name?sslmode=require
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
PORT=5000
```

**Frontend (.env in root directory):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### 3. Database Setup
```bash
cd backend
npm run migrate  # Create tables
npm run seed     # Seed initial data
cd ..
```

#### 4. Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## 📡 API Documentation

The backend provides a comprehensive REST API:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/search` - Search profiles

### File Upload
- `POST /api/upload/avatar` - Upload avatar
- `POST /api/upload/listing-images` - Upload listing images

Full API documentation available in `backend/README.md`

## 🛡️ Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention
- File upload restrictions

## 📊 Database Schema

### Users
- Authentication and account management
- Email verification and password reset

### Profiles
- User profiles with customizable fields
- Support for different user types (buyer, seller, landlord, etc.)

### Categories
- Marketplace categories (Education, Health, Jobs, etc.)

### Listings
- Product/service listings with images
- Location-based search capability

See `backend/migrations/` for complete schema definitions.

## 🎨 Frontend Features

- **Responsive Design**: Works on all device sizes
- **Modern UI**: Built with shadcn/ui components
- **Dark/Light Mode**: Theme switching support
- **Form Validation**: Client-side validation with Zod
- **File Upload**: Drag & drop image uploads
- **Authentication**: Seamless login/register flow
- **Profile Management**: Complete user profile system

## 🔧 Development

### Project Structure
```
v-market/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Database & service config
│   ├── migrations/         # Database migrations
│   └── package.json
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── public/                # Static assets
└── package.json
```

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed initial data

## 🚀 Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:
- Vercel: Connect GitHub repo and deploy
- Netlify: Connect GitHub repo and deploy
- Build command: `npm run build`
- Publish directory: `dist`

### Backend Deployment
The backend can be deployed to any Node.js hosting service:
- Railway, Render, Heroku, AWS, etc.
- Set environment variables for production
- Run migrations: `npm run migrate`

### Environment Variables for Production
Make sure to set secure values for:
- `JWT_SECRET` - Strong random secret
- `DATABASE_URL` - Production Neon database
- `CLOUDINARY_*` - Production Cloudinary credentials
- `CORS_ORIGIN` - Your frontend domain

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### API Testing
Health check: `curl http://localhost:5000/health`

### Frontend Testing
```bash
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Create an issue for bug reports
- Join our Discord for community support
- Check documentation in `backend/README.md`

---

Built with ❤️ for Kenya's digital marketplace needs.
