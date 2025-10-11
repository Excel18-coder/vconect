const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Custom Neon adapter for Auth.js
function NeonAdapter(connectionString) {
  const sql = neon(connectionString);

  return {
    async createUser(user) {
      const id = crypto.randomUUID();
      
      const newUser = await sql`
        INSERT INTO users (id, email, email_verified, name, image)
        VALUES (${id}, ${user.email}, ${user.emailVerified || false}, ${user.name}, ${user.image})
        RETURNING id, email, email_verified as "emailVerified", name, image, created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      return newUser[0];
    },

    async getUser(id) {
      const user = await sql`
        SELECT id, email, email_verified as "emailVerified", name, image, created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE id = ${id}
      `;
      
      return user[0] || null;
    },

    async getUserByEmail(email) {
      const user = await sql`
        SELECT id, email, email_verified as "emailVerified", name, image, created_at as "createdAt", updated_at as "updatedAt"
        FROM users 
        WHERE email = ${email}
      `;
      
      return user[0] || null;
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const result = await sql`
        SELECT u.id, u.email, u.email_verified as "emailVerified", u.name, u.image, u.created_at as "createdAt", u.updated_at as "updatedAt"
        FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider_account_id = ${providerAccountId} AND a.provider = ${provider}
      `;
      
      return result[0] || null;
    },

    async updateUser(user) {
      const updatedUser = await sql`
        UPDATE users 
        SET 
          email = ${user.email},
          email_verified = ${user.emailVerified},
          name = ${user.name},
          image = ${user.image},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
        RETURNING id, email, email_verified as "emailVerified", name, image, created_at as "createdAt", updated_at as "updatedAt"
      `;
      
      return updatedUser[0];
    },

    async deleteUser(userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    },

    async linkAccount(account) {
      await sql`
        INSERT INTO accounts (
          user_id, 
          type, 
          provider, 
          provider_account_id, 
          refresh_token, 
          access_token, 
          expires_at, 
          token_type, 
          scope, 
          id_token, 
          session_state
        ) VALUES (
          ${account.userId},
          ${account.type},
          ${account.provider},
          ${account.providerAccountId},
          ${account.refresh_token},
          ${account.access_token},
          ${account.expires_at},
          ${account.token_type},
          ${account.scope},
          ${account.id_token},
          ${account.session_state}
        )
      `;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await sql`
        DELETE FROM accounts 
        WHERE provider_account_id = ${providerAccountId} AND provider = ${provider}
      `;
    },

    async createSession(session) {
      const newSession = await sql`
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES (${session.sessionToken}, ${session.userId}, ${session.expires})
        RETURNING session_token as "sessionToken", user_id as "userId", expires
      `;
      
      return newSession[0];
    },

    async getSessionAndUser(sessionToken) {
      const result = await sql`
        SELECT 
          s.session_token as "sessionToken", 
          s.user_id as "userId", 
          s.expires,
          u.id, 
          u.email, 
          u.email_verified as "emailVerified", 
          u.name, 
          u.image,
          u.created_at as "createdAt",
          u.updated_at as "updatedAt"
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken}
      `;

      if (!result[0]) return null;

      const { sessionToken: token, userId, expires, ...user } = result[0];
      
      return {
        session: { sessionToken: token, userId, expires },
        user: { id: user.id, ...user }
      };
    },

    async updateSession(session) {
      const updatedSession = await sql`
        UPDATE sessions 
        SET expires = ${session.expires}
        WHERE session_token = ${session.sessionToken}
        RETURNING session_token as "sessionToken", user_id as "userId", expires
      `;
      
      return updatedSession[0];
    },

    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },

    async createVerificationToken(verificationToken) {
      const newToken = await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${verificationToken.identifier}, ${verificationToken.token}, ${verificationToken.expires})
        RETURNING identifier, token, expires
      `;
      
      return newToken[0];
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      
      return verificationToken[0] || null;
    }
  };
}

module.exports = { NeonAdapter };
