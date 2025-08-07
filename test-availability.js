const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testAvailability() {
  try {
    console.log('=== TESTING AVAILABILITY APIs ===');
    
    // Test 1: Get availability slots for companion 5
    console.log('\n1. Testing /api/availability-slots for companion 5...');
    const availabilityResponse = await makeRequest('http://localhost:1337/api/availability-slots?filters[companion][$eq]=5&sort=dayOfWeek:asc,startTime:asc', {
      headers: {
        'Authorization': 'Bearer 7542f3245bc3cedf9b9d646d3a8a028f8f6b8db0ccbf7ca5163a7bb977a7697f43f60ed0ea3926eff5a163243188ef475b3a985a106acdd69afe7e1fe6a1cff4d9b2fae167f8d5408f20ed7358f0fad5266a7fa968440fb23e5a0edde2f5875b2988289d6538ae57c1b4d2169fa3c6f91758640814fba94dddab158d0d8609ac',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', availabilityResponse.status);
    console.log('Data:', JSON.stringify(availabilityResponse.data, null, 2));
    
    // Test 2: Get sessions for companion 5 for today
    console.log('\n2. Testing /api/sessions for companion 5 today...');
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const sessionsResponse = await makeRequest(`http://localhost:1337/api/sessions?filters[companion][$eq]=5&filters[status][$in][0]=confirmed&filters[status][$in][1]=in_progress&filters[startTime][$gte]=${startOfDay.toISOString()}&filters[endTime][$lte]=${endOfDay.toISOString()}`, {
      headers: {
        'Authorization': 'Bearer 7542f3245bc3cedf9b9d646d3a8a028f8f6b8db0ccbf7ca5163a7bb977a7697f43f60ed0ea3926eff5a163243188ef475b3a985a106acdd69afe7e1fe6a1cff4d9b2fae167f8d5408f20ed7358f0fad5266a7fa968440fb23e5a0edde2f5875b2988289d6538ae57c1b4d2169fa3c6f91758640814fba94dddab158d0d8609ac',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', sessionsResponse.status);
    console.log('Data:', JSON.stringify(sessionsResponse.data, null, 2));
    
    // Test 3: Test frontend API (if available)
    console.log('\n3. Testing frontend API /api/sessions/companion/5/real-availability...');
    try {
      const frontendResponse = await makeRequest(`http://localhost:3001/api/sessions/companion/5/real-availability?date=${today}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', frontendResponse.status);
      console.log('Data:', JSON.stringify(frontendResponse.data, null, 2));
    } catch (error) {
      console.log('Frontend API not available:', error.message);
    }
    
  } catch (error) {
    console.error('Error testing availability:', error);
  }
}

testAvailability(); 