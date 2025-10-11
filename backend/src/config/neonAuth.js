const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Neon Auth configuration
const neonAuthConfig = {
  database: {
    connectionString: process.env.DATABASE_URL,
  },
  auth: {
    secret: process.env.AUTH_SECRET || process.env.JWT_SECRET,
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
    pages: {
      signIn: '/auth/signin',
      signUp: '/auth/signup',
      error: '/auth/error',
    }
  },
  callbacks: {
    async session({ session, user }) {
      // Add user ID to session
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Persist user ID in token
      if (user) {
        token.userId = user.id;
      }
      return token;
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email);
    },
    async signOut({ session, token }) {
      console.log('User signed out');
    },
    async createUser({ user }) {
      console.log('New user created:', user.email);
      // Create profile for new user
      await createUserProfile(user);
    }
  }
};

// Function to create user profile
const createUserProfile = async (user) => {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    await sql`
      INSERT INTO profiles (user_id, display_name, user_type)
      VALUES (${user.id}, ${user.name || user.email.split('@')[0]}, 'buyer')
      ON CONFLICT (user_id) DO NOTHING
    `;
    console.log('Profile created for user:', user.email);
  } catch (error) {
    console.error('Error creating profile:', error);
  }
};

// Enhanced user management functions
const userUtils = {
  async getUserById(id) {
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`
      SELECT 
        u.id, u.email, u.email_verified, u.created_at, u.updated_at,
        p.display_name, p.avatar_url, p.bio, p.user_type, 
        p.phone_number, p.location
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ${id}
    `;
    return users[0] || null;
  },

  async getUserByEmail(email) {
    const sql = neon(process.env.DATABASE_URL);
    const users = await sql`
      SELECT 
        u.id, u.email, u.email_verified, u.created_at, u.updated_at,
        p.display_name, p.avatar_url, p.bio, p.user_type, 
        p.phone_number, p.location
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.email = ${email}
    `;
    return users[0] || null;
  },

  async createUser(userData) {
    const sql = neon(process.env.DATABASE_URL);
    
    // Create user
    const users = await sql`
      INSERT INTO users (email, email_verified, name, image)
      VALUES (${userData.email}, ${userData.emailVerified || false}, ${userData.name}, ${userData.image})
      RETURNING id, email, email_verified, created_at, name, image
    `;
    
    const user = users[0];
    
    // Create profile
    await createUserProfile(user);
    
    return user;
  },

  async updateUser(id, updates) {
    const sql = neon(process.env.DATABASE_URL);
    
    const updateFields = {};
    if (updates.email) updateFields.email = updates.email;
    if (updates.emailVerified !== undefined) updateFields.email_verified = updates.emailVerified;
    if (updates.name) updateFields.name = updates.name;
    if (updates.image) updateFields.image = updates.image;
    
    if (Object.keys(updateFields).length === 0) {
      return null;
    }
    
    const users = await sql`
      UPDATE users 
      SET ${sql(updateFields)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, email_verified, created_at, updated_at, name, image
    `;
    
    return users[0] || null;
  },

  async deleteUser(id) {
    const sql = neon(process.env.DATABASE_URL);
    
    // Delete user (profiles will be deleted via CASCADE)
    await sql`DELETE FROM users WHERE id = ${id}`;
    
    return true;
  },

  async verifyEmail(id) {
    const sql = neon(process.env.DATABASE_URL);
    
    const users = await sql`
      UPDATE users 
      SET email_verified = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, email_verified
    `;
    
    return users[0] || null;
  }
};

module.exports = {
  neonAuthConfig,
  userUtils,
  createUserProfile
};
