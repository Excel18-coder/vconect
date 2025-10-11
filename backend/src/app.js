const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import middlewares
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
// const { neonAuthMiddleware } = require('./middleware/neonAuth'); // Disabled for now

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const uploadRoutes = require('./routes/upload');
const productRoutes = require('./routes/products');
const tutorRoutes = require('./routes/tutors');
const landlordRoutes = require('./routes/landlords');
const employerRoutes = require('./routes/employers');
const doctorRoutes = require('./routes/doctors');
const buyerRoutes = require('./routes/buyers');
// const neonAuthRoutes = require('./routes/neonAuth');

// Import config
const { testConnection } = require('./config/database');
const { testCloudinaryConnection } = require('./config/cloudinary');

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
    },
  },
}));

// CORS configuration - More permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
    }
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS Error: Origin not allowed:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// Neon Auth middleware (disabled for now, using JWT auth)
// app.use(neonAuthMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const cloudinaryStatus = await testCloudinaryConnection();
    
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        cloudinary: cloudinaryStatus ? 'connected' : 'disconnected'
      }
    };

    const statusCode = dbStatus && cloudinaryStatus ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/neon-auth', neonAuthRoutes); // Disabled for now
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/landlords', landlordRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/buyers', buyerRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'V-Market API',
    version: '1.0.0',
    description: 'Backend API for V-Market - Kenya\'s Digital Marketplace',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      upload: '/api/upload',
      products: '/api/products',
      tutors: '/api/tutors',
      landlords: '/api/landlords',
      employers: '/api/employers',
      doctors: '/api/doctors',
      buyers: '/api/buyers'
    },
    documentation: 'https://github.com/Excel18-coder/-Vmarket',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to V-Market API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
