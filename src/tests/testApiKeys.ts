/**
 * Quick check for API Key routes and v1 endpoints
 * Usage: ts-node src/tests/testApiKeys.ts
 */
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.prod' });
} else {
  dotenv.config({ path: '.env' });
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

console.log('🔑 API Keys Configuration\n');
console.log('════════════════════════════════════════════════════════════════\n');

const required = ['API_KEY_PREFIX', 'API_KEY_BYTES', 'API_KEY_DEFAULT_ENV'];
let ok = true;
for (const k of required) {
  const v = process.env[k];
  const present = !!v;
  console.log(`${present ? '✅' : '❌'} ${k}: ${present ? v : 'NOT SET'}`);
  if (!present) ok = false;
}

console.log('\n🌐 API Endpoints:\n');
const endpoints = [
  { method: 'POST', path: '/api/keys', desc: 'Create new API key (requires JWT auth)' },
  { method: 'GET', path: '/api/keys', desc: 'List API keys (requires JWT auth)' },
  { method: 'DELETE', path: '/api/keys/:id', desc: 'Revoke API key (requires JWT auth)' },
  { method: 'POST', path: '/v1/model/rephrase', desc: 'Run model with API key' },
];
for (const e of endpoints) {
  console.log(`${e.method.padEnd(6)} ${BACKEND_URL}${e.path}`);
  console.log(`       → ${e.desc}\n`);
}

console.log('Example curl (replace with real key):');
console.log(`curl -X POST ${BACKEND_URL}/v1/model/rephrase \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: sk_test_AbC123def456.XYZ..." \\\n  -d '{"text":"Hello"}'`);

console.log('\nDone.');
