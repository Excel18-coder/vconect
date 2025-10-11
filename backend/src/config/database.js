const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Database connection using Neon with increased timeout
const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: 'no-store',
  },
});

// Helper function to execute queries with timeout
const executeWithTimeout = async (queryFn, timeoutMs = 25000) => {
  return Promise.race([
    queryFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout exceeded')), timeoutMs)
    )
  ]);
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await sql`SELECT version()`;
    console.log('✅ Database connected successfully');
    console.log('PostgreSQL version:', result[0].version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  sql,
  testConnection,
  executeWithTimeout
};
