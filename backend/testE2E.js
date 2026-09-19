const axios = require('axios');

async function testAuthFlow() {
  const baseURL = 'http://localhost:5001/api';
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('--- STARTING END-TO-END AUTH TEST ---');
  console.log(`Target Email: ${email}`);
  
  try {
    // 1. Register as a Manager
    console.log('\n[TEST 1] Registering as Manager...');
    const registerRes = await axios.post(`${baseURL}/auth/register`, {
      fullName: 'Test Manager',
      email: email,
      phone: '1234567890',
      password: password,
      role: 'manager'
    });
    
    console.log('✅ Registration Successful!');
    console.log('Returned User Object:', registerRes.data.data.user);
    
    if (registerRes.data.data.user.role !== 'manager') {
      throw new Error('Role was not saved as manager!');
    }

    // 2. Try logging in as Admin (Should Fail)
    console.log('\n[TEST 2] Logging in as Admin (Expecting Failure)...');
    try {
      await axios.post(`${baseURL}/auth/login`, {
        email: email,
        password: password,
        role: 'admin'
      });
      console.log('❌ ERROR: Login succeeded but should have failed!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('✅ Login Rejected with 403 Forbidden. Message:', err.response.data.message);
      } else {
        console.log('❌ Unexpected error:', err.message);
      }
    }

    // 3. Try logging in as Manager (Should Succeed)
    console.log('\n[TEST 3] Logging in as Manager (Expecting Success)...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: email,
      password: password,
      role: 'manager'
    });
    console.log('✅ Login Successful!');
    console.log('Returned User Object:', loginRes.data.data.user);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testAuthFlow();
