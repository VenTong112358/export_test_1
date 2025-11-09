const fetch = require('node-fetch');

// 测试登录功能
async function testLogin() {
  console.log('=== 测试登录功能 ===');
  
  try {
    // 测试登录端点
    console.log('1. 测试登录端点...');
    const loginResponse = await fetch('https://masterwordai.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test123'
      })
    });
    
    console.log(`登录响应状态: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('登录成功响应:', loginData);
      
      // 如果登录成功，测试带token的翻译API
      if (loginData.access_token) {
        console.log('\n2. 使用获得的token测试翻译API...');
        const translationResponse = await fetch('https://masterwordai.com/test/english_word_search/1/hello', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${loginData.access_token}`
          }
        });
        
        console.log(`翻译API响应状态: ${translationResponse.status} ${translationResponse.statusText}`);
        
        if (translationResponse.ok) {
          const translationData = await translationResponse.text();
          console.log('翻译API成功响应:', translationData);
        } else {
          const errorText = await translationResponse.text();
          console.log('翻译API错误响应:', errorText);
        }
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('登录失败响应:', errorText);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
  }
}

// 测试注册功能
async function testRegister() {
  console.log('\n=== 测试注册功能 ===');
  
  try {
    const registerResponse = await fetch('https://masterwordai.com/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        password: 'test123',
        phoneNumber: '13800138000'
      })
    });
    
    console.log(`注册响应状态: ${registerResponse.status} ${registerResponse.statusText}`);
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('注册成功响应:', registerData);
    } else {
      const errorText = await registerResponse.text();
      console.log('注册失败响应:', errorText);
    }
    
  } catch (error) {
    console.error('注册测试中发生错误:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testLogin();
  await testRegister();
}

runTests();