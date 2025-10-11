const { Auth } = require('@auth/core');
const { NeonAdapter } = require('../adapters/neonAdapter');
const { neonAuthConfig } = require('../config/neonAuth');

// Neon Auth middleware for Express
const createNeonAuthHandler = (req, res) => {
  const authConfig = {
    ...neonAuthConfig,
    adapter: NeonAdapter(process.env.DATABASE_URL),
    providers: [
      // Email provider for magic links
      {
        id: "email",
        type: "email",
        name: "Email",
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      },
      // Credentials provider for email/password
      {
        id: "credentials",
        name: "credentials",
        type: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { userUtils } = require('../config/neonAuth');
          const bcrypt = require('bcryptjs');
          
          try {
            const user = await userUtils.getUserByEmail(credentials.email);
            
            if (!user || !user.password_hash) {
              return null;
            }

            const isValidPassword = await bcrypt.compare(
              credentials.password, 
              user.password_hash
            );

            if (!isValidPassword) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.display_name || user.name,
              emailVerified: user.email_verified,
              image: user.avatar_url || user.image
            };
          } catch (error) {
            console.error('Auth error:', error);
            return null;
          }
        }
      }
    ],
    trustHost: true,
  };

  return Auth({
    req: {
      body: req.body,
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url,
    },
    ...authConfig
  });
};

// Express middleware to handle Neon Auth routes
const neonAuthMiddleware = async (req, res, next) => {
  // Only handle auth routes
  if (!req.path.startsWith('/api/auth/')) {
    return next();
  }

  try {
    const authResponse = await createNeonAuthHandler(req, res);
    
    // Set response headers
    if (authResponse.headers) {
      Object.entries(authResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Set status code
    if (authResponse.status) {
      res.status(authResponse.status);
    }

    // Send response body
    if (authResponse.body) {
      return res.send(authResponse.body);
    }

    res.end();
  } catch (error) {
    console.error('Neon Auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Session verification middleware
const verifyNeonSession = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.['next-auth.session-token'] ||
                        req.cookies?.['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    const { NeonAdapter } = require('../adapters/neonAdapter');
    const adapter = NeonAdapter(process.env.DATABASE_URL);
    
    const sessionData = await adapter.getSessionAndUser(sessionToken);
    
    if (!sessionData || new Date(sessionData.session.expires) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Attach user to request
    req.user = sessionData.user;
    req.session = sessionData.session;
    
    next();
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(401).json({ error: 'Session verification failed' });
  }
};

// Get current session endpoint
const getCurrentSession = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                        req.cookies?.['next-auth.session-token'] ||
                        req.cookies?.['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token' });
    }

    const { NeonAdapter } = require('../adapters/neonAdapter');
    const adapter = NeonAdapter(process.env.DATABASE_URL);
    
    const sessionData = await adapter.getSessionAndUser(sessionToken);
    
    if (!sessionData || new Date(sessionData.session.expires) < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get user profile data
    const { userUtils } = require('../config/neonAuth');
    const userProfile = await userUtils.getUserById(sessionData.user.id);

    res.json({
      user: userProfile,
      session: sessionData.session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

module.exports = {
  neonAuthMiddleware,
  verifyNeonSession,
  getCurrentSession,
  createNeonAuthHandler
};
