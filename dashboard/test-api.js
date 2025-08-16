// Simple test script to verify the games API endpoint
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create two different token formats
const createTokenWithUser = () => {
  return jwt.sign(
    { 
      user: { 
        id: 123, 
        email: 'test@example.com', 
        username: 'testuser'
      } 
    }, 
    'aeon-analytics-secret-key'
  );
};

const createDirectToken = () => {
  return jwt.sign(
    { 
      id: 123, 
      email: 'test@example.com', 
      username: 'testuser'
    }, 
    'aeon-analytics-secret-key'
  );
};

const testEndpoint = async (token, description) => {
  console.log(`\n=== Testing with ${description} ===`);
  console.log('Token:', token);
  
  try {
    const response = await axios.get('http://localhost:3001/games', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Response:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

// Run tests with both token formats
const runTests = async () => {
  // Test with token that has user field
  await testEndpoint(createTokenWithUser(), "token containing user field");
  
  // Test with direct token
  await testEndpoint(createDirectToken(), "direct token without user field");
};

runTests(); 