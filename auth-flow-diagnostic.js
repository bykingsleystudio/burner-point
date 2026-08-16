/**
 * Burner Point Production Auth Flow Diagnostic
 * 
 * This script tests the complete OAuth and session exchange flow
 * to identify which step is failing in production.
 */

const https = require('https');
const http = require('http');

const API_URL = 'https://api.burnerpoint.com';
const WEB_URL = 'https://burnerpoint.com';
const SUPABASE_URL = 'https://sdjcavvwramruehjdhpb.supabase.co';

function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Burner-Point-Diagnostic/1.0',
          ...headers,
        },
        timeout: 10000,
      };

      const req = protocol.request(urlObj, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = data ? JSON.parse(data) : null;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: json || data,
              raw: data,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data,
              error: 'Failed to parse JSON',
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function test(name, fn) {
  try {
    console.log(`\n► Testing: ${name}`);
    await fn();
    console.log(`  ✓ PASSED`);
  } catch (e) {
    console.log(`  ✗ FAILED: ${e.message}`);
  }
}

async function run() {
  console.log('========================================');
  console.log('Burner Point Auth Flow Diagnostic');
  console.log('========================================');

  // Test 1: API Health
  await test('API is reachable', async () => {
    const res = await makeRequest(`${API_URL}/health`);
    if (res.status !== 200 && res.status !== 404) {
      throw new Error(`Unexpected status: ${res.status}`);
    }
    console.log(`    Status: ${res.status}`);
  });

  // Test 2: CORS headers
  await test('CORS allows burnerpoint.com', async () => {
    const res = await makeRequest(`${API_URL}/health`, 'OPTIONS', null, {
      Origin: WEB_URL,
    });
    const allowOrigin = res.headers['access-control-allow-origin'];
    console.log(`    Allow-Origin: ${allowOrigin}`);
    if (!allowOrigin || allowOrigin === 'null') {
      throw new Error('CORS not configured for burnerpoint.com');
    }
  });

  // Test 3: Exchange endpoint exists
  await test('Exchange endpoint is accessible', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/supabase/exchange`, 'POST', {
      accessToken: 'dummy-token',
    });
    // Should fail with 401 because token is invalid, but endpoint should exist
    if (res.status === 404) {
      throw new Error('Exchange endpoint not found (404)');
    }
    console.log(`    Status: ${res.status} (expected 401 for invalid token)`);
    if (res.status === 401 || res.status === 400 || res.status === 200) {
      // These are all valid responses that mean the endpoint exists
    } else {
      throw new Error(`Unexpected status: ${res.status}`);
    }
  });

  // Test 4: Register endpoint exists
  await test('Register endpoint is accessible', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/register`, 'POST', {
      email: 'test@example.com',
      password: 'Test@1234',
    });
    if (res.status === 404) {
      throw new Error('Register endpoint not found (404)');
    }
    console.log(`    Status: ${res.status}`);
  });

  // Test 5: Login endpoint exists
  await test('Login endpoint is accessible', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/login`, 'POST', {
      email: 'test@example.com',
      password: 'test',
    });
    if (res.status === 404) {
      throw new Error('Login endpoint not found (404)');
    }
    console.log(`    Status: ${res.status}`);
  });

  // Test 6: Web app is accessible
  await test('Web app homepage loads', async () => {
    const res = await makeRequest(WEB_URL);
    if (res.status !== 200) {
      throw new Error(`Homepage returned ${res.status}`);
    }
    console.log(`    Status: ${res.status}`);
    if (!res.raw || res.raw.length < 100) {
      throw new Error('Homepage content too small, might be error page');
    }
    console.log(`    Content length: ${res.raw.length} bytes`);
  });

  // Test 7: Auth callback route exists
  await test('OAuth callback route exists', async () => {
    const res = await makeRequest(`${WEB_URL}/auth/callback?code=test`);
    if (res.status !== 200) {
      throw new Error(`Callback returned ${res.status}`);
    }
    console.log(`    Status: ${res.status}`);
  });

  // Test 8: Login page loads
  await test('Login page loads', async () => {
    const res = await makeRequest(`${WEB_URL}/sign-in`);
    if (res.status !== 200) {
      throw new Error(`Login page returned ${res.status}`);
    }
    console.log(`    Status: ${res.status}`);
  });

  // Test 9: Database connectivity (via API)
  await test('API can access database', async () => {
    // Try to login with invalid creds - if DB is accessible, we'll get 401
    const res = await makeRequest(`${API_URL}/api/auth/login`, 'POST', {
      identifier: 'test@example.com',
      password: 'invalidpassword123',
    });
    if (res.status === 500 || res.status === 503) {
      throw new Error(`Database error: ${res.status}`);
    }
    console.log(`    Status: ${res.status} (expected 401 for invalid creds)`);
  });

  console.log('\n========================================');
  console.log('Diagnostic complete');
  console.log('========================================\n');
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
