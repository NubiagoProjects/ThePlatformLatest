import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Create a temporary Prisma client with SQLite for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

// Test users data
const testUsers = [
  {
    name: 'Admin User',
    email: 'admin@nubiago.com',
    password: 'Admin@123456',
    role: 'ADMIN' as const,
    phone: '+2348012345678',
    isActive: true
  },
  {
    name: 'Supplier User',
    email: 'supplier@nubiago.com',
    password: 'Supplier@123456',
    role: 'SUPPLIER' as const,
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
    role: 'USER' as const,
    phone: '+2348034567890',
    isActive: true
  }
];

// Sample categories
const sampleCategories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest electronic devices and gadgets',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel for all ages',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
  },
  {
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Home appliances and kitchen essentials',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'
  }
];

// Sample products for supplier
const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    slug: 'wireless-bluetooth-headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
    price: 89.99,
    comparePrice: 129.99,
    cost: 45.00,
    quantity: 50,
    sku: 'WH-BT001',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
    ],
    tags: ['wireless', 'bluetooth', 'noise-cancelling', 'headphones'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Smart Fitness Watch',
    slug: 'smart-fitness-watch',
    description: 'Advanced fitness tracking with heart rate monitoring and GPS',
    price: 199.99,
    comparePrice: 249.99,
    cost: 120.00,
    quantity: 25,
    sku: 'SW-FT002',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400'
    ],
    tags: ['smartwatch', 'fitness', 'health-tracking', 'gps'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Premium Coffee Maker',
    slug: 'premium-coffee-maker',
    description: 'Professional coffee maker for home use with programmable settings',
    price: 149.99,
    comparePrice: 199.99,
    cost: 80.00,
    quantity: 15,
    sku: 'CM-PR003',
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
    ],
    tags: ['coffee', 'appliance', 'kitchen', 'premium'],
    isActive: true,
    isFeatured: false
  }
];

async function setupLocalDatabase() {
  try {
    console.log('🚀 Starting local database setup...');

    // Create categories first
    console.log('📂 Creating categories...');
    const categories = [];
    for (const categoryData of sampleCategories) {
      const category = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: categoryData,
        create: categoryData
      });
      categories.push(category);
      console.log(`✅ Created category: ${category.name}`);
    }

    // Create users
    console.log('\n👥 Creating users...');
    const users = [];
    
    for (const userData of testUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          phone: userData.phone,
          isActive: userData.isActive
        },
        create: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          phone: userData.phone,
          isActive: userData.isActive
        }
      });
      
      users.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role})`);

      // Create supplier profile if needed
      if (userData.role === 'SUPPLIER' && userData.supplierProfile) {
        const supplierProfile = await prisma.supplierProfile.upsert({
          where: { userId: user.id },
          update: userData.supplierProfile,
          create: {
            ...userData.supplierProfile,
            userId: user.id
          }
        });
        console.log(`✅ Created supplier profile: ${supplierProfile.companyName}`);
      }
    }

    // Create sample products for supplier
    console.log('\n📦 Creating sample products...');
    const supplier = users.find(u => u.role === 'SUPPLIER');
    if (supplier) {
      const supplierProfile = await prisma.supplierProfile.findUnique({
        where: { userId: supplier.id }
      });

      if (supplierProfile) {
        for (const productData of sampleProducts) {
          const product = await prisma.product.upsert({
            where: { slug: productData.slug },
            update: {
              ...productData,
              categoryId: categories[0].id, // Electronics category
              supplierId: supplierProfile.id
            },
            create: {
              ...productData,
              categoryId: categories[0].id, // Electronics category
              supplierId: supplierProfile.id
            }
          });
          console.log(`✅ Created product: ${product.name}`);
        }
      }
    }

    // Create sample addresses for customer
    console.log('\n📍 Creating sample addresses...');
    const customer = users.find(u => u.role === 'USER');
    if (customer) {
      const addresses = [
        {
          userId: customer.id,
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main Street',
          city: 'Lagos',
          province: 'Lagos State',
          country: 'Nigeria',
          zip: '100001',
          phone: '+2348034567890',
          isDefault: true
        },
        {
          userId: customer.id,
          firstName: 'John',
          lastName: 'Doe',
          address1: '456 Business Avenue',
          city: 'Abuja',
          province: 'FCT',
          country: 'Nigeria',
          zip: '900001',
          phone: '+2348034567890',
          isDefault: false
        }
      ];

      for (const addressData of addresses) {
        const address = await prisma.address.create({
          data: addressData
        });
        console.log(`✅ Created address: ${address.address1}, ${address.city}`);
      }
    }

    console.log('\n🎉 Local database setup completed successfully!');
    console.log('\n📋 Test Users Created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const user of users) {
      console.log(`👤 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${testUsers.find(u => u.email === user.email)?.password}`);
      console.log('');
    }

    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Dashboard: http://localhost:3000/dashboard/admin');
    console.log('Supplier Dashboard: http://localhost:3000/dashboard/supplier');
    console.log('User Dashboard: http://localhost:3000/dashboard/user');
    console.log('');
    console.log('💾 Database file created: dev.db');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up local database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupLocalDatabase(); 