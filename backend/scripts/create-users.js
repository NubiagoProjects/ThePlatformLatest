const bcrypt = require('bcryptjs');

// Test users data
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@nubiago.com',
    password: 'Admin@123456',
    role: 'ADMIN',
    phone: '+2348012345678',
    isActive: true
  },
  {
    name: 'Supplier User',
    email: 'supplier@nubiago.com',
    password: 'Supplier@123456',
    role: 'SUPPLIER',
    phone: '+2348023456789',
    isActive: true,
    supplierProfile: {
      companyName: 'TechMart Electronics',
      description: 'Leading electronics supplier with premium products',
      website: 'https://techmart.com',
      logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200',
      isVerified: true,
      rating: 4.8
    }
  },
  {
    name: 'Customer User',
    email: 'customer@nubiago.com',
    password: 'Customer@123456',
    role: 'USER',
    phone: '+2348034567890',
    isActive: true
  }
];

async function generateUserCredentials() {
  console.log('🚀 Generating test user credentials...\n');

  for (const userData of testUsers) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    console.log(`👤 ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Hashed Password: ${hashedPassword}`);
    console.log('');
  }

  console.log('🔐 Login URLs:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Dashboard: http://localhost:3000/dashboard/admin');
  console.log('Supplier Dashboard: http://localhost:3000/dashboard/supplier');
  console.log('User Dashboard: http://localhost:3000/dashboard/user');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('1. Start your backend server: npm run dev');
  console.log('2. Start your frontend: cd .. && npm run dev');
  console.log('3. Use these credentials to test the application');
  console.log('');
  console.log('💡 For production, you should:');
  console.log('- Change these passwords');
  console.log('- Set up proper database (PostgreSQL recommended)');
  console.log('- Configure environment variables');
  console.log('- Set up proper authentication');
}

generateUserCredentials(); 