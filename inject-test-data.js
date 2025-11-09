// 这个脚本用于将测试用户数据注入到React Native应用的AsyncStorage中
const fs = require('fs');
const path = require('path');

// 读取之前创建的测试数据
const mockStorageFile = path.join(__dirname, 'mock-storage.json');

if (fs.existsSync(mockStorageFile)) {
  const mockData = JSON.parse(fs.readFileSync(mockStorageFile, 'utf8'));
  
  console.log('=== 测试数据注入脚本 ===');
  console.log('发现的测试数据:');
  console.log(JSON.stringify(mockData, null, 2));
  
  // 创建一个可以在React Native中执行的代码片段
  const injectionCode = `
// 在React Native应用中执行以下代码来注入测试数据:

import AsyncStorage from '@react-native-async-storage/async-storage';

const injectTestData = async () => {
  try {
    console.log('开始注入测试数据...');
    
    // 注入用户数据
    await AsyncStorage.setItem('@users', '${mockData['@users']}');
    console.log('✓ 用户数据已注入');
    
    // 注入认证token
    await AsyncStorage.setItem('@auth_token', '${mockData['@auth_token']}');
    console.log('✓ 认证token已注入');
    
    // 注入访问token
    await AsyncStorage.setItem('@access_token', '${mockData['@access_token']}');
    console.log('✓ 访问token已注入');
    
    // 注入用户数据
    await AsyncStorage.setItem('@user_data', '${mockData['@user_data']}');
    console.log('✓ 用户详细数据已注入');
    
    console.log('测试数据注入完成！');
    console.log('现在可以使用以下账号登录:');
    console.log('用户名: testuser');
    console.log('密码: test123');
    
    return true;
  } catch (error) {
    console.error('注入测试数据失败:', error);
    return false;
  }
};

// 导出函数
export { injectTestData };

// 如果直接调用，立即执行
// injectTestData();
  `;
  
  // 将注入代码写入文件
  const injectionFile = path.join(__dirname, 'test-data-injection.ts');
  fs.writeFileSync(injectionFile, injectionCode);
  
  console.log('\n=== 注入代码已生成 ===');
  console.log('文件位置:', injectionFile);
  console.log('\n请在React Native应用中导入并执行 injectTestData() 函数');
  
} else {
  console.error('未找到测试数据文件:', mockStorageFile);
  console.log('请先运行 create-test-user.js 创建测试数据');
}