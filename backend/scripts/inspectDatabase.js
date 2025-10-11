const { sql } = require('../src/config/database');

const inspectDatabase = async () => {
  try {
    console.log('🔍 Starting comprehensive database inspection...\n');

    // Test database connection
    console.log('📡 Testing database connection...');
    await sql`SELECT 1 as connection_test`;
    console.log('✅ Database connection successful\n');

    // Get all tables
    console.log('📋 Fetching all tables...');
    const tables = await sql`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    console.log('');

    // Inspect each table's structure
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🔎 Inspecting table: ${tableName}`);
      
      // Get columns
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      console.log(`  Columns (${columns.length}):`);
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        const precision = col.numeric_precision ? `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})` : '';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        
        console.log(`    ${col.column_name}: ${col.data_type}${length}${precision} ${nullable}${defaultVal}`);
      });

      // Get constraints
      const constraints = await sql`
        SELECT 
          constraint_name,
          constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
      `;

      if (constraints.length > 0) {
        console.log(`  Constraints (${constraints.length}):`);
        constraints.forEach(constraint => {
          console.log(`    ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }

      // Get foreign keys
      const foreignKeys = await sql`
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.constraint_column_usage ccu 
          ON kcu.constraint_name = ccu.constraint_name
        JOIN information_schema.table_constraints tc 
          ON kcu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.table_name = ${tableName}
      `;

      if (foreignKeys.length > 0) {
        console.log(`  Foreign Keys (${foreignKeys.length}):`);
        foreignKeys.forEach(fk => {
          console.log(`    ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }

      // Get indexes
      const indexes = await sql`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = ${tableName}
        AND schemaname = 'public'
      `;

      if (indexes.length > 0) {
        console.log(`  Indexes (${indexes.length}):`);
        indexes.forEach(idx => {
          console.log(`    ${idx.indexname}`);
        });
      }

      console.log('');
    }

    // Check for missing required tables
    const requiredTables = [
      'users', 'profiles', 'categories', 'listings', 
      'favorites', 'messages', 'user_sessions',
      'accounts', 'sessions', 'verification_tokens'
    ];

    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('✅ All required tables are present');
    }

    // Test data insertion and retrieval
    console.log('\n🧪 Testing basic operations...');
    
    // Test users table
    try {
      const testUser = await sql`
        INSERT INTO users (email, password_hash, name, email_verified) 
        VALUES ('test@example.com', 'test_hash', 'Test User', false)
        ON CONFLICT (email) DO UPDATE SET name = 'Test User Updated'
        RETURNING id, email, name
      `;
      console.log('✅ Users table: INSERT/UPDATE operation successful');
      
      // Test profile creation
      await sql`
        INSERT INTO profiles (user_id, display_name, user_type)
        VALUES (${testUser[0].id}, 'Test Profile', 'buyer')
        ON CONFLICT (user_id) DO UPDATE SET display_name = 'Test Profile Updated'
      `;
      console.log('✅ Profiles table: INSERT/UPDATE operation successful');
      
      // Clean up test data
      await sql`DELETE FROM users WHERE email = 'test@example.com'`;
      console.log('✅ Test data cleanup successful');
      
    } catch (error) {
      console.log('❌ Database operations test failed:', error.message);
    }

    console.log('\n🎉 Database inspection completed successfully!');
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
    throw error;
  }
};

// Run inspection if called directly
if (require.main === module) {
  inspectDatabase()
    .then(() => {
      console.log('Database inspection completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database inspection failed:', error);
      process.exit(1);
    });
}

module.exports = { inspectDatabase };
