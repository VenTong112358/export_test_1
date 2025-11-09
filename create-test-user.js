const AsyncStorage = require('@react-native-async-storage/async-storage');
const fs = require('fs');
const path = require('path');

// 模拟AsyncStorage for Node.js
const mockStorage = {};
const MockAsyncStorage = {
  async getItem(key) {
    return mockStorage[key] || null;
  },
  async setItem(key, value) {
    mockStorage[key] = value;
    // 同时写入文件以便在应用中使用
    const storageFile = path.join(__dirname, 'mock-storage.json');
    fs.writeFileSync(storageFile, JSON.stringify(mockStorage, null, 2));
  },
  async removeItem(key) {
    delete mockStorage[key];
  }
};

// 创建测试用户
async function createTestUser() {
  console.log('=== 创建测试用户 ===');
  
  const testUser = {
    id: 'test_user_001',
    username: 'testuser',
    password: 'test123',
    phoneNumber: '13800138000',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  
  // 模拟本地存储用户数据
  const users = [testUser];
  await MockAsyncStorage.setItem('@users', JSON.stringify(users));
  
  console.log('测试用户已创建:', testUser);
  console.log('用户名: testuser');
  console.log('密码: test123');
  
  // 创建一个模拟token
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfMDAxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTc1NjQ4ODc0OX0.mock_signature';
  await MockAsyncStorage.setItem('@auth_token', mockToken);
  await MockAsyncStorage.setItem('@access_token', mockToken);
  
  console.log('模拟Token已创建:', mockToken.substring(0, 50) + '...');
  
  // 创建用户数据
  const userData = {
    id: testUser.id,
    username: testUser.username,
    phoneNumber: testUser.phoneNumber,
    createdAt: testUser.createdAt,
    lastLoginAt: testUser.lastLoginAt,
    password: testUser.password
  };
  
  await MockAsyncStorage.setItem('@user_data', JSON.stringify(userData));
  
  console.log('\n=== 存储文件已创建 ===');
  console.log('文件位置:', path.join(__dirname, 'mock-storage.json'));
  
  // 显示存储内容
  console.log('\n=== 存储内容 ===');
  console.log(JSON.stringify(mockStorage, null, 2));
  
  console.log('\n=== 使用说明 ===');
  console.log('1. 在应用中使用以下账号登录:');
  console.log('   用户名: testuser');
  console.log('   密码: test123');
  console.log('2. 或者在应用启动时，这些数据应该会被自动加载');
}

createTestUser().catch(console.error);