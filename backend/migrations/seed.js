const { sql } = require('../src/config/database');

const seedCategories = async () => {
  try {
    console.log('🌱 Seeding categories...');

    const categories = [
      {
        name: 'Education',
        slug: 'education',
        description: 'Educational services, tutoring, courses, and learning materials',
        icon_url: '/images/education.jpg'
      },
      {
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Movies, music, games, events, and entertainment services',
        icon_url: '/images/entertainment.jpg'
      },
      {
        name: 'Health',
        slug: 'health',
        description: 'Healthcare services, medical equipment, and wellness products',
        icon_url: '/images/health.jpg'
      },
      {
        name: 'Jobs',
        slug: 'jobs',
        description: 'Job opportunities, freelance work, and career services',
        icon_url: '/images/jobs.jpg'
      },
      {
        name: 'Housing',
        slug: 'housing',
        description: 'Real estate, rentals, property sales, and housing services',
        icon_url: '/images/house.jpg'
      },
      {
        name: 'Transport',
        slug: 'transport',
        description: 'Transportation services, vehicle sales, and travel options',
        icon_url: '/images/transport.jpg'
      },
      {
        name: 'Market',
        slug: 'market',
        description: 'General marketplace for buying and selling various items',
        icon_url: '/images/market.jpg'
      }
    ];

    for (const category of categories) {
      await sql`
        INSERT INTO categories (name, slug, description, icon_url)
        VALUES (${category.name}, ${category.slug}, ${category.description}, ${category.icon_url})
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon_url = EXCLUDED.icon_url,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    console.log('✅ Categories seeded successfully!');
    
    // Display seeded categories
    const result = await sql`SELECT name, slug, description FROM categories ORDER BY name`;
    console.log('📋 Seeded categories:');
    result.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug}): ${cat.description}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCategories };
