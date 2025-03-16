const axios = require('axios');

// Test the endpoint
async function testEndpoint() {
  try {
    // Replace with an actual bollard ID from your database
    const response = await axios.get('http://localhost:5001/api/quiz-questions/bollards/67d5bdf15fe682411270986d/correct-countries');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEndpoint(); 