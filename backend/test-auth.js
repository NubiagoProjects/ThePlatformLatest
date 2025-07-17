const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Get test users
    console.log('1️⃣ Testing GET /api/test/users...');
    const usersResponse = await axios.get(`${API_BASE}/test/users`);
    console.log('✅ Users endpoint working:', usersResponse.data.success);
    console.log('   Found', usersResponse.data.data.length, 'users\n');

    // Test 2: Login with admin
    console.log('2️⃣ Testing admin login...');
    const adminLogin = await axios.post(`${API_BASE}/test/login`, {
      email: 'admin@nubiago.com',
      password: 'Admin@123456'
    });
    console.log('✅ Admin login successful');
    console.log('   Token received:', adminLogin.data.data.accessToken ? 'Yes' : 'No');
    console.log('   User role:', adminLogin.data.data.user.role);
    const adminToken = adminLogin.data.data.accessToken;

    // Test 3: Login with supplier
    console.log('\n3️⃣ Testing supplier login...');
    const supplierLogin = await axios.post(`${API_BASE}/test/login`, {
      email: 'supplier@nubiago.com',
      password: 'Supplier@123456'
    });
    console.log('✅ Supplier login successful');
    console.log('   User role:', supplierLogin.data.data.user.role);
    const supplierToken = supplierLogin.data.data.accessToken;

    // Test 4: Login with customer
    console.log('\n4️⃣ Testing customer login...');
    const customerLogin = await axios.post(`${API_BASE}/test/login`, {
      email: 'customer@nubiago.com',
      password: 'Customer@123456'
    });
    console.log('✅ Customer login successful');
    console.log('   User role:', customerLogin.data.data.user.role);
    const customerToken = customerLogin.data.data.accessToken;

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Test Credentials Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin: admin@nubiago.com / Admin@123456');
    console.log('👤 Supplier: supplier@nubiago.com / Supplier@123456');
    console.log('👤 Customer: customer@nubiago.com / Customer@123456');
    console.log('\n🔗 Frontend URLs:');
    console.log('   Admin: http://localhost:3000/dashboard/admin');
    console.log('   Supplier: http://localhost:3000/dashboard/supplier');
    console.log('   Customer: http://localhost:3000/dashboard/user');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
  }
}

testAuthentication(); 