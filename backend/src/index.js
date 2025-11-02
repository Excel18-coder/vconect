// Safe dotenv loading - only load if module exists and .env file exists
let dotenvLoaded = false;
try {
  const fs = require('fs');
  const path = require('path');

  // Check if .env file exists in the current directory
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config();
    dotenvLoaded = true;
    console.log('✅ Environment variables loaded from .env file');
  } else {
    console.log('ℹ️  No .env file found, using environment variables from host');
  }
} catch (error) {
  console.log('ℹ️  dotenv not available, using environment variables from host');
}

// Validate critical environment variables
console.log('🔍 Validating environment variables...');

const requiredEnvVars = {
  'DATABASE_URL': 'PostgreSQL database connection string',
  'JWT_SECRET': 'Secret key for signing JWT access tokens (min 32 characters)',
  'JWT_REFRESH_SECRET': 'Secret key for signing JWT refresh tokens (min 32 characters)',
  'CLOUDINARY_CLOUD_NAME': 'Cloudinary cloud name for image uploads',
  'CLOUDINARY_API_KEY': 'Cloudinary API key',
  'CLOUDINARY_API_SECRET': 'Cloudinary API secret'
};

const missingVars = [];
const warnings = [];

// Check each required variable
Object.entries(requiredEnvVars).forEach(([varName, description]) => {
  const value = process.env[varName];
  
  if (!value) {
    missingVars.push(`  ❌ ${varName} - ${description}`);
  } else {
    // Validate JWT secrets length
    if ((varName === 'JWT_SECRET' || varName === 'JWT_REFRESH_SECRET') && value.length < 32) {
      warnings.push(`  ⚠️  ${varName} is too short (${value.length} chars). Recommended: 64+ characters for security.`);
    }
    console.log(`  ✅ ${varName} is set`);
  }
});

// Log warnings
if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(warning));
}

// Exit if critical variables are missing
if (missingVars.length > 0) {
  console.error('\n❌ CRITICAL ERROR: Missing required environment variables:\n');
  missingVars.forEach(msg => console.error(msg));
  console.error('\n📋 TO FIX THIS ON RENDER:');
  console.error('   1. Go to: https://dashboard.render.com/');
  console.error('   2. Select your backend service');
  console.error('   3. Click "Environment" in left sidebar');
  console.error('   4. Add the missing variables listed above');
  console.error('   5. Click "Save Changes"');
  console.error('   6. Wait for automatic redeploy\n');
  console.error('💡 TIP: Use backend/.env.render.example as a template\n');
  process.exit(1);
}

console.log('\n✅ All required environment variables are present and valid\n');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const logger = require('./utils/logger');
const { sendError } = require('./utils/response');

// Import routes
const authRoutes = require('./routes/auth');
const neonAuthRoutes = require('./routes/neonAuth');
const profileRoutes = require('./routes/profile');
const productsRoutes = require('./routes/products');
const buyersRoutes = require('./routes/buyers');
const landlordRoutes = require('./routes/landlords');
const tutorRoutes = require('./routes/tutors');
const doctorRoutes = require('./routes/doctors');
const employerRoutes = require('./routes/employers');
const uploadRoutes = require('./routes/upload');
const uploadsRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (important for production behind reverse proxies like Render)
app.set('trust proxy', 1);

// Middleware
// CORS configuration for both development and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://v-market.onrender.com',
  'https://v-market-frontend.onrender.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Only use morgan in development to save memory
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(compression());
app.use(express.json({ limit: '5mb' })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '5mb' })); // Reduced from 10mb
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/neon-auth', neonAuthRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/buyers', buyersRoutes);
app.use('/api/landlords', landlordRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/uploads', uploadsRoutes); // New dedicated uploads route for all service providers

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'V-Market API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      neonAuth: '/api/neon-auth',
      profile: '/api/profile',
      products: '/api/products',
      buyers: '/api/buyers',
      landlords: '/api/landlords',
      tutors: '/api/tutors',
      doctors: '/api/doctors',
      employers: '/api/employers',
      upload: '/api/upload'
    }
  });
});

// 404 handler
app.use((req, res) => {
  sendError(res, 'Route not found', 404);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Invalid JSON in request body', 400);
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400);
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'Something went wrong';
    
  sendError(res, message, statusCode);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 V-Market API Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  logger.info(`📍 API endpoints available at http://localhost:${PORT}/api`);
  logger.info(`💚 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
