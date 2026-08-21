// Simple integration test script
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Backend is running:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend is not running:', error.message);
    return false;
  }
}

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    let token = '';
    
    try {
      console.log('Attempting login with demo credentials...');
      const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      token = loginRes.data.data.token;
      console.log('✅ Login successful!');
    } catch (err) {
      console.log('Demo user does not exist. Registering...');
      const regRes = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123',
        phone: '1234567890',
        role: 'admin'
      });
      token = regRes.data.data.token;
      console.log('✅ Registration successful!');
    }

    const response = await axios.get(`${BACKEND_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Products API is working:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Products API failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running integration tests...\n');
  
  const backendOk = await testBackend();
  const apiOk = await testAPI();
  
  console.log('\n📊 Test Results:');
  console.log(`Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`API: ${apiOk ? '✅' : '❌'}`);
  
  if (backendOk && apiOk) {
    console.log('\n🎉 Integration test passed! Your application is ready to use.');
    console.log(`Frontend: ${FRONTEND_URL}`);
    console.log(`Backend: ${BACKEND_URL}`);
  } else {
    console.log('\n⚠️  Some tests failed. Make sure both services are running.');
    console.log('Run: npm run dev');
  }
}

runTests();
