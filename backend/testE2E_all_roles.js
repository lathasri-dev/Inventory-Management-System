const axios = require('axios');

async function testAllRoles() {
  const baseURL = 'http://localhost:5001/api';
  const timestamp = Date.now();
  
  const accounts = [
    { role: 'admin', email: `admin_${timestamp}@example.com`, password: 'Password123!' },
    { role: 'manager', email: `manager_${timestamp}@example.com`, password: 'Password123!' },
    { role: 'user', email: `user_${timestamp}@example.com`, password: 'Password123!' }
  ];

  console.log('--- STARTING BULK REGISTRATION TEST ---');

  for (const acc of accounts) {
    console.log(`\n[TEST] Registering new ${acc.role.toUpperCase()} account...`);
    try {
      const res = await axios.post(`${baseURL}/auth/register`, {
        fullName: `Test ${acc.role}`,
        email: acc.email,
        phone: '9876543210',
        password: acc.password,
        role: acc.role
      });
      console.log(`✅ Registration Successful for ${acc.email}!`);
      console.log(`Returned MongoDB Document:`);
      console.log(res.data.data.user);
    } catch (error) {
      console.error(`❌ Registration Failed for ${acc.role}:`, error.response?.data || error.message);
    }
  }
}

testAllRoles();
