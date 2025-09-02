const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test the superior leave demand endpoint
async function testSuperiorAPI() {
  try {
    console.log('Testing Superior API endpoints...');
    
    // First, let's try to login to get a token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@system.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    // Set up axios with the token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test getting superior leave demands
    console.log('\nTesting GET /admin/superior/leave-demands...');
    const leaveDemandsResponse = await api.get('/admin/superior/leave-demands');
    console.log('Leave demands response:', leaveDemandsResponse.data);
    
    // Test getting superior justifications
    console.log('\nTesting GET /admin/superior/justifications...');
    const justificationsResponse = await api.get('/admin/superior/justifications');
    console.log('Justifications response:', justificationsResponse.data);
    
    console.log('\n✅ All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSuperiorAPI();
