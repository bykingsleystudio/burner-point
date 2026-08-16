/**
 * Enhanced Burner Point Auth Diagnostic
 * 
 * Follows redirects and provides more detailed error information
 */

const https = require('https');
const http = require('http');
const url = require('url');

const API_URL = 'https://api.burnerpoint.com';
const WEB_URL = 'https://burnerpoint.com';

function makeRequest(reqUrl, method = 'GET', body = null, headers = {}, followRedirects = 0) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(reqUrl);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Burner-Point-Diagnostic/2.0',
          ...headers,
        },
        timeout: 10000,
      };

      const req = protocol.request(urlObj, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Handle redirects
          if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) && followRedirects < 3) {
            const redirectUrl = res.headers.location;
            console.log(`    → Redirected to: ${redirectUrl}`);
            resolve(makeRequest(redirectUrl, 'GET', null, headers, followRedirects + 1));
            return;
          }

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
    console.log(`\n► ${name}`);
    await fn();
    console.log(`  ✓ PASSED`);
    return true;
  } catch (e) {
    console.log(`  ✗ FAILED: ${e.message}`);
    return false;
  }
}

async function run() {
  console.log('========================================');
  console.log('Enhanced Auth Diagnostic v2');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  if (await test('API health check', async () => {
    const res = await makeRequest(`${API_URL}/health`);
    console.log(`    Status: ${res.status}`);
    if (res.status !== 200) throw new Error(`Unexpected status: ${res.status}`);
  })) passed++; else failed++;

  if (await test('CORS configuration', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/login`, 'POST', { identifier: 'test', password: 'test' });
    const allowOrigin = res.headers ? res.headers['access-control-allow-origin'] : 'NOT SET';
    console.log(`    Allow-Origin header: ${allowOrigin}`);
    if (!allowOrigin || allowOrigin === 'null') throw new Error('CORS not configured');
  })) passed++; else failed++;

  if (await test('Web homepage (follow redirects)', async () => {
    const res = await makeRequest(WEB_URL);
    console.log(`    Final status: ${res.status}`);
    if (res.status !== 200) throw new Error(`Final status: ${res.status}`);
    if (!res.raw || res.raw.length < 100) throw new Error('Content too small');
    console.log(`    Content: ${res.raw.slice(0, 80)}...`);
  })) passed++; else failed++;

  if (await test('Auth callback route', async () => {
    const res = await makeRequest(`${WEB_URL}/auth/callback?code=test_code_12345`);
    console.log(`    Final status: ${res.status}`);
    if (res.status !== 200) throw new Error(`Callback status: ${res.status}`);
  })) passed++; else failed++;

  if (await test('Exchange endpoint with invalid token', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/supabase/exchange`, 'POST', { accessToken: 'invalid-token' });
    console.log(`    Status: ${res.status}`);
    console.log(`    Error: ${res.body?.message || res.body?.error || 'N/A'}`);
    if (res.status === 401 || res.status === 400) {
      console.log(`    ✓ Correctly rejected invalid token`);
    } else if (res.status === 500) {
      throw new Error('Exchange endpoint returned 500 - database error');
    }
  })) passed++; else failed++;

  if (await test('Login endpoint error response', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/login`, 'POST', {
      identifier: 'nonexistent@example.com',
      password: 'wrongpassword',
    });
    console.log(`    Status: ${res.status}`);
    console.log(`    Response: ${JSON.stringify(res.body).slice(0, 100)}...`);
    if (res.status === 500) {
      throw new Error(`Database error: ${res.body?.message || 'Unknown error'}`);
    }
    if (res.status !== 401 && res.status !== 400) {
      throw new Error(`Unexpected status: ${res.status}`);
    }
  })) passed++; else failed++;

  if (await test('Register endpoint error response', async () => {
    const res = await makeRequest(`${API_URL}/api/auth/register`, 'POST', {
      email: 'test@example.com',
      password: 'Test@1234',
      phone: '+2348000000000',
    });
    console.log(`    Status: ${res.status}`);
    console.log(`    Response: ${JSON.stringify(res.body).slice(0, 100)}...`);
    if (res.status === 500) {
      throw new Error(`Database error: ${res.body?.message || 'Unknown error'}`);
    }
  })) passed++; else failed++;

  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    console.log('Issues detected:');
    if (failed >= 2) {
      console.log('  • Database connectivity problem (500 errors)');
    }
    console.log('  • Check DATABASE_URL environment variable on API server');
    console.log('  • Check Supabase connection pool status');
    console.log('  • Check API server logs for detailed errors');
  }
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
