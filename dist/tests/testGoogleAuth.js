"use strict";
/**
 * Test script for Google OAuth endpoints
 *
 * Run this to verify your Google OAuth setup is working correctly
 * Usage: ts-node src/tests/testGoogleAuth.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
if (process.env.NODE_ENV === 'production') {
    dotenv_1.default.config({ path: '.env.prod' });
}
else {
    dotenv_1.default.config({ path: '.env' });
}
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
console.log('🔍 Google OAuth Configuration Check\n');
console.log('════════════════════════════════════════════════════════════════\n');
// Check required environment variables
const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'BACKEND_URL',
    'FRONTEND_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
];
const optionalVars = [
    { name: 'GOOGLE_CLIENT_SECRET', description: 'Only needed for Authorization Code Flow (/google/start)' }
];
let allPresent = true;
console.log('📋 Required Environment Variables:\n');
requiredVars.forEach((varName) => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const display = value
        ? (varName.includes('SECRET') ? '***hidden***' : value)
        : '⚠️  NOT SET';
    console.log(`${status} ${varName}: ${display}`);
    if (!value) {
        allPresent = false;
    }
});
console.log('\n📋 Optional Environment Variables:\n');
optionalVars.forEach((opt) => {
    const value = process.env[opt.name];
    const status = value ? '✅' : '⚪';
    const display = value ? '***hidden***' : 'Not set';
    console.log(`${status} ${opt.name}: ${display}`);
    console.log(`   → ${opt.description}`);
});
console.log('\n════════════════════════════════════════════════════════════════\n');
// Check endpoint availability
console.log('🌐 API Endpoints:\n');
const endpoints = [
    { method: 'GET', path: '/api/auth/google/start', description: 'Google OAuth Start (Authorization Code Flow)' },
    { method: 'GET', path: '/api/auth/google/callback', description: 'Google OAuth Callback' },
    { method: 'POST', path: '/api/auth/google', description: 'Google ID Token Verification' },
    { method: 'POST', path: '/api/auth/register', description: 'Traditional Registration' },
    { method: 'POST', path: '/api/auth/login', description: 'Traditional Login' },
    { method: 'GET', path: '/api/auth/me', description: 'Get Current User' },
    { method: 'POST', path: '/api/auth/logout', description: 'Logout' },
];
endpoints.forEach((endpoint) => {
    console.log(`${endpoint.method.padEnd(6)} ${BACKEND_URL}${endpoint.path}`);
    console.log(`       → ${endpoint.description}\n`);
});
console.log('════════════════════════════════════════════════════════════════\n');
// Google Cloud Console configuration
console.log('☁️  Google Cloud Console Configuration:\n');
console.log('Make sure these are configured in Google Cloud Console:\n');
console.log('Authorized JavaScript origins:');
console.log(`  • ${FRONTEND_URL}`);
console.log('');
console.log('Authorized redirect URIs:');
console.log(`  • ${BACKEND_URL}/api/auth/google/callback`);
console.log('');
console.log('════════════════════════════════════════════════════════════════\n');
// Security features
console.log('🔒 Security Features Enabled:\n');
const features = [
    '✅ Google ID token verification',
    '✅ CSRF protection (state parameter)',
    '✅ Rate limiting (10 req/15min)',
    '✅ CORS with credentials support',
    '✅ HttpOnly secure cookies',
    '✅ Token expiration validation',
    '✅ Audience verification',
    '✅ Issuer validation',
];
features.forEach(feature => console.log(feature));
console.log('\n════════════════════════════════════════════════════════════════\n');
// Testing instructions
console.log('🧪 Quick Testing Guide:\n');
console.log('1. Manual Browser Test (Authorization Code Flow):');
console.log(`   Open: ${BACKEND_URL}/api/auth/google/start`);
console.log('   → Should redirect to Google sign-in\n');
console.log('2. Frontend Integration Test (ID Token Flow):');
console.log('   • Use @react-oauth/google in your frontend');
console.log(`   • POST the credential to: ${BACKEND_URL}/api/auth/google`);
console.log('   • Include credentials: "include" in fetch options\n');
console.log('3. Check User Profile:');
console.log(`   GET ${BACKEND_URL}/api/auth/me`);
console.log('   • Include Authorization: Bearer <access_token>\n');
console.log('════════════════════════════════════════════════════════════════\n');
// Summary
if (allPresent) {
    console.log('✅ All required environment variables are set!');
    console.log('✅ Google OAuth is ready to use!\n');
    console.log('Next steps:');
    console.log('1. Make sure your server is running: npm run dev');
    console.log('2. Test the /api/auth/google/start endpoint in your browser');
    console.log('3. Integrate with your frontend using the examples in GOOGLE_AUTH_GUIDE.md\n');
}
else {
    console.log('⚠️  Some required environment variables are missing!');
    console.log('Please check your .env file and add the missing variables.\n');
    console.log('See .env.example for the complete list of required variables.\n');
}
console.log('📚 For detailed documentation, see:');
console.log('   • GOOGLE_AUTH_GUIDE.md - Complete implementation guide');
console.log('   • GOOGLE_OAUTH_SETUP.md - Quick setup reference');
console.log('   • .env.example - All environment variables\n');
