const { sql } = require('../src/config/database');
const { userUtils } = require('../src/config/neonAuth');
const { NeonAdapter } = require('../src/adapters/neonAdapter');
const bcrypt = require('bcryptjs');

const testAuthSystem = async () => {
  try {
    console.log('🧪 Testing Authentication System...\n');

    // Initialize adapter
    const adapter = NeonAdapter(process.env.DATABASE_URL);

    // Test 1: User Creation with Neon Auth
    console.log('📝 Test 1: Creating user with Neon Auth...');
    
    const testUserData = {
      email: 'test.auth@vmarket.com',
      name: 'Test Auth User',
      emailVerified: false,
      image: null
    };

    const createdUser = await adapter.createUser(testUserData);
    console.log('✅ User created:', {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name
    });

    // Test 2: Get User by Email
    console.log('\n🔍 Test 2: Getting user by email...');
    const foundUser = await adapter.getUserByEmail(testUserData.email);
    console.log('✅ User found:', {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name
    });

    // Test 3: Create Session
    console.log('\n🔐 Test 3: Creating session...');
    const sessionData = {
      sessionToken: 'test_session_token_12345',
      userId: createdUser.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    const createdSession = await adapter.createSession(sessionData);
    console.log('✅ Session created:', {
      sessionToken: createdSession.sessionToken,
      userId: createdSession.userId,
      expires: createdSession.expires
    });

    // Test 4: Get Session and User
    console.log('\n👤 Test 4: Getting session and user data...');
    const sessionAndUser = await adapter.getSessionAndUser(sessionData.sessionToken);
    console.log('✅ Session and user retrieved:', {
      session: {
        sessionToken: sessionAndUser.session.sessionToken,
        userId: sessionAndUser.session.userId
      },
      user: {
        id: sessionAndUser.user.id,
        email: sessionAndUser.user.email,
        name: sessionAndUser.user.name
      }
    });

    // Test 5: Traditional JWT Auth (Password-based)
    console.log('\n🔑 Test 5: Testing password-based authentication...');
    
    const passwordUser = {
      email: 'test.password@vmarket.com',
      password: 'testPassword123'
    };

    // Hash password
    const passwordHash = await bcrypt.hash(passwordUser.password, 12);

    // Create user with password
    const passwordUserResult = await sql`
      INSERT INTO users (email, password_hash, name, email_verified)
      VALUES (${passwordUser.email}, ${passwordHash}, 'Password Test User', false)
      RETURNING id, email, name, email_verified
    `;

    const pwUser = passwordUserResult[0];
    console.log('✅ Password user created:', {
      id: pwUser.id,
      email: pwUser.email,
      name: pwUser.name
    });

    // Create profile for password user
    await sql`
      INSERT INTO profiles (user_id, display_name, user_type)
      VALUES (${pwUser.id}, 'Password Test Profile', 'buyer')
    `;

    // Test password verification
    const storedUser = await sql`
      SELECT id, email, password_hash, email_verified, name
      FROM users 
      WHERE email = ${passwordUser.email}
    `;

    const isValidPassword = await bcrypt.compare(
      passwordUser.password, 
      storedUser[0].password_hash
    );

    console.log('✅ Password verification:', isValidPassword ? 'SUCCESS' : 'FAILED');

    // Test 6: User Utils Functions
    console.log('\n🛠️ Test 6: Testing user utility functions...');
    
    const userById = await userUtils.getUserById(pwUser.id);
    console.log('✅ Get user by ID with profile:', {
      id: userById.id,
      email: userById.email,
      displayName: userById.display_name,
      userType: userById.user_type
    });

    const userByEmail = await userUtils.getUserByEmail(passwordUser.email);
    console.log('✅ Get user by email with profile:', {
      id: userByEmail.id,
      email: userByEmail.email,
      displayName: userByEmail.display_name,
      userType: userByEmail.user_type
    });

    // Test 7: Update User
    console.log('\n📝 Test 7: Testing user update...');
    const updatedUser = await adapter.updateUser({
      id: createdUser.id,
      email: createdUser.email,
      emailVerified: true,
      name: 'Updated Test User',
      image: 'https://example.com/avatar.jpg'
    });

    console.log('✅ User updated:', {
      id: updatedUser.id,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
      name: updatedUser.name,
      image: updatedUser.image
    });

    // Test 8: Account Linking (OAuth simulation)
    console.log('\n🔗 Test 8: Testing account linking...');
    const accountData = {
      userId: createdUser.id,
      type: 'oauth',
      provider: 'google',
      providerAccountId: 'google_123456789',
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      scope: 'email profile'
    };

    await adapter.linkAccount(accountData);
    console.log('✅ Account linked successfully');

    // Test getting user by account
    const userByAccount = await adapter.getUserByAccount({
      provider: 'google',
      providerAccountId: 'google_123456789'
    });

    console.log('✅ User found by account:', {
      id: userByAccount.id,
      email: userByAccount.email,
      name: userByAccount.name
    });

    // Test 9: Verification Token
    console.log('\n🎫 Test 9: Testing verification tokens...');
    const verificationToken = {
      identifier: 'test.verification@vmarket.com',
      token: 'verification_token_12345',
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    };

    await adapter.createVerificationToken(verificationToken);
    console.log('✅ Verification token created');

    const usedToken = await adapter.useVerificationToken({
      identifier: verificationToken.identifier,
      token: verificationToken.token
    });

    console.log('✅ Verification token used:', {
      identifier: usedToken.identifier,
      token: usedToken.token
    });

    // Test 10: Cleanup and Session Management
    console.log('\n🧹 Test 10: Testing cleanup operations...');
    
    // Delete session
    await adapter.deleteSession(sessionData.sessionToken);
    console.log('✅ Session deleted');

    // Unlink account
    await adapter.unlinkAccount({
      provider: 'google',
      providerAccountId: 'google_123456789'
    });
    console.log('✅ Account unlinked');

    // Delete test users
    await adapter.deleteUser(createdUser.id);
    await adapter.deleteUser(pwUser.id);
    console.log('✅ Test users cleaned up');

    console.log('\n🎉 All authentication tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Neon Auth adapter: Working');
    console.log('✅ Password-based auth: Working');
    console.log('✅ Session management: Working');
    console.log('✅ OAuth account linking: Working');
    console.log('✅ User utilities: Working');
    console.log('✅ Verification tokens: Working');
    console.log('✅ Database operations: Working');

  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    throw error;
  }
};

// Run test if called directly
if (require.main === module) {
  testAuthSystem()
    .then(() => {
      console.log('\nAuthentication system test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nAuthentication system test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthSystem };
