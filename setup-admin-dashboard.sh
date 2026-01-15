#!/bin/bash

# Admin Dashboard Setup Script
# This script initializes the admin analytics system

echo "========================================="
echo "Admin Dashboard Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
cd backend
npm install

echo ""
echo "🗄️  Step 2: Running analytics migration..."
node migrations/create-admin-analytics.js

if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

echo ""
echo "📊 Step 3: Running initial analytics aggregation..."
echo "This will backfill the last 30 days of analytics data..."

# Create a temporary script to run aggregation
cat > /tmp/run-aggregation.js << 'EOF'
const { analyticsAggregationService } = require('./src/services/analytics/analytics-aggregation-service');

(async () => {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    console.log('Starting backfill from', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    await analyticsAggregationService.backfillHistorical(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    console.log('✅ Aggregation complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Aggregation failed:', error);
    process.exit(1);
  }
})();
EOF

node /tmp/run-aggregation.js
rm /tmp/run-aggregation.js

echo ""
echo "👤 Step 4: Creating default super admin..."

# Run the existing admin creation script if it exists
if [ -f "scripts/create-default-admin.js" ]; then
    node scripts/create-default-admin.js
else
    echo "⚠️  Warning: create-default-admin.js not found. You'll need to manually promote a user to super_admin."
    echo ""
    echo "To manually create a super admin, run this SQL:"
    echo ""
    echo "UPDATE profiles SET user_type = 'super_admin' WHERE user_id = (SELECT id FROM users WHERE email = 'your-admin-email@example.com');"
fi

echo ""
echo "========================================="
echo "✅ Admin Dashboard Setup Complete!"
echo "========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update an existing user to super_admin role (if not done above)"
echo "2. Start the backend server: npm run dev"
echo "3. Access the admin dashboard at: http://localhost:5173/admin"
echo ""
echo "📚 Documentation:"
echo "  - Architecture: docs/ADMIN_SYSTEM_ARCHITECTURE.md"
echo "  - Implementation: docs/ADMIN_IMPLEMENTATION_SUMMARY.md"
echo ""
echo "🔐 Security Notes:"
echo "  - Change all default admin passwords immediately"
echo "  - Configure IP whitelist for production"
echo "  - Set up monitoring alerts for critical security events"
echo "  - Review and test all permission levels"
echo ""
echo "📊 Analytics:"
echo "  - Daily aggregation will run automatically at midnight UTC"
echo "  - Historical data has been backfilled for the last 30 days"
echo "  - View dashboard KPIs at: GET /api/admin/analytics/dashboard"
echo ""

cd ..
