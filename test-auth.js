#!/usr/bin/env node

/**
 * Test Backend Authentication
 * Quick test to verify the auth endpoint is working
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:7102/api';

async function testAuth() {
  try {
    console.log('🧪 Testing Backend Authentication...\n');

    // Test 1: Check if backend is responding
    console.log('📡 Testing backend health...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`);
      console.log('✅ Backend is healthy:', healthResponse.data);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      return;
    }

    // Test 2: Test login endpoint with invalid data (should get 400)
    console.log('\n🔐 Testing login endpoint with invalid data...');
    try {
      const invalidResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: '',
        password: ''
      });
      console.log('❌ Should have failed with invalid data');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 for invalid data:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 3: Test login endpoint with valid format but wrong credentials
    console.log('\n🔐 Testing login endpoint with wrong credentials...');
    try {
      const wrongCredsResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed with wrong credentials');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 for wrong credentials:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }

    // Test 4: Check if we have any test admin users in the database
    console.log('\n👤 Checking for admin users...');
    console.log('   Note: You might need to create an admin user first');
    console.log('   Run: cd backend && node scripts/createAdmin.js');

  } catch (error) {
    console.error('❌ Test failed with error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
}

// Run the test
if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };
