/**
 * Direct test of POST /api/auth/supabase/exchange endpoint
 * This script tests the endpoint with various scenarios to capture the actual error
 */

const https = require('https');

// Test scenarios
const tests = [
  {
    name: 'Empty token',
    body: { accessToken: '' },
  },
  {
    name: 'Invalid token format',
    body: { accessToken: 'invalid.token.here' },
  },
  {
    name: 'Missing token',
    body: {},
  },
  {
    name: 'Valid JWT but wrong secret',
    body: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Nka2NhdnZ3cmFtcnVlaGpkaHBiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjkyNzA0MDAwLCJleHAiOjE2OTI3OTA0MDB9.invalid_signature' },
  },
];

async function testEndpoint(testCase) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.burnerpoint.com',
      port: 443,
      path: '/api/auth/supabase/exchange',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          test: testCase.name,
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        test: testCase.name,
        error: error.message,
      });
    });

    req.write(JSON.stringify(testCase.body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing POST /api/auth/supabase/exchange endpoint...\n');

  for (const test of tests) {
    console.log(`\n=== ${test.name} ===`);
    console.log(`Sending: ${JSON.stringify(test.body)}`);

    try {
      const result = await testEndpoint(test);

      if (result.error) {
        console.log(`ERROR: ${result.error}`);
      } else {
        console.log(`Status: ${result.status}`);
        console.log(`Response:`, result.body);
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(result.body);
          console.log('Parsed response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('(Response is not valid JSON)');
        }
      }
    } catch (error) {
      console.log(`EXCEPTION: ${error.message}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

runTests().catch(console.error);
