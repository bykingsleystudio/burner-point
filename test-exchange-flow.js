/**
 * Get a valid Supabase session token by authenticating
 * Then test the exchange endpoint
 */

const https = require('https');

// Supabase credentials - these should be in production
const SUPABASE_URL = 'https://sdjcavvwramruehjdhpb.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Nka2NhdnZ3cmFtcnVlaGpkaHBiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJhenAiOiJzcGFmdWtsRkdva01UWnlWRlJrIiwic3ViIjoiMWY3ZTc2ZTItZGU1Mi00OGI1LTg0MjAtYzFkNGM2N2Y0YTVhIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MTYyMzI0MDAwMCwiaWF0IjoxNjIzMjM2NDAwLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF9jb25maXJtZWQiOmZhbHNlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1cCI6InB1YmxpYyIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoibmlsIiwiYW1yIjp7fSwiYXBwX21ldGFkYXRhIjp7fSwidXNlcl9tZXRhZGF0YSI6e30sImlzX2Fub255bW91cyI6ZmFsc2V9.0LQx4xG3KMHsLxmlKy4hI0d3nxmV4Y_JH_sN3CQXPh0';

console.log('SUPABASE_ANON_KEY available:', !!SUPABASE_ANON_KEY);
console.log('SUPABASE_URL:', SUPABASE_URL);

// Try to get a session (won't work without real credentials, but let's see what happens)
async function makeHttpsRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    // Step 1: Try to create a test user
    console.log('\n1. Attempting to create test user in Supabase...');
    
    const signUpResult = await makeHttpsRequest(
      'sdjcavvwramruehjdhpb.supabase.co',
      '/auth/v1/signup',
      'POST',
      {
        'apikey': SUPABASE_ANON_KEY,
      },
      {
        email: `test-${Date.now()}@burnerpoint.test`,
        password: 'TestPass123!',
        data: {
          firstName: 'Test',
          lastName: 'User',
        },
      }
    );

    console.log('SignUp Status:', signUpResult.status);
    console.log('SignUp Response:', signUpResult.body);

    if (signUpResult.status === 200 || signUpResult.status === 201) {
      const session = JSON.parse(signUpResult.body);
      const token = session.session?.access_token;

      if (token) {
        console.log('\n2. Got valid session token! Testing exchange endpoint...');
        console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

        // Now test the exchange endpoint
        const exchangeResult = await makeHttpsRequest(
          'api.burnerpoint.com',
          '/api/auth/supabase/exchange',
          'POST',
          {},
          {
            accessToken: token,
            profile: {
              firstName: 'Test',
              lastName: 'User',
              termsAccepted: true,
              privacyAccepted: true,
            },
          }
        );

        console.log('\nExchange Status:', exchangeResult.status);
        console.log('Exchange Response:', exchangeResult.body);

        if (exchangeResult.status === 500) {
          console.log('\n❌ GOT 500 ERROR!');
          console.log('This is the production bug!');
          try {
            const error = JSON.parse(exchangeResult.body);
            console.log('Error details:', JSON.stringify(error, null, 2));
          } catch (e) {
            console.log('Response is not JSON');
          }
        } else if (exchangeResult.status === 200) {
          console.log('\n✅ Exchange succeeded!');
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
