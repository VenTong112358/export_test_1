import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationApi } from '@data/api/TranslationApi';
import { useTheme } from '@hooks/useTheme';

export default function TestApiPage() {
  const { theme } = useTheme();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const injectTestData = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('开始注入测试数据...');
    
    try {
      // 注入用户数据
      await AsyncStorage.setItem('@users', '[{"id":"test_user_001","username":"testuser","password":"test123","phoneNumber":"13800138000","createdAt":"2025-08-28T17:33:14.934Z","lastLoginAt":"2025-08-28T17:33:15.010Z"}]');
      addResult('✓ 用户数据已注入');
      
      // 注入认证token
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfMDAxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTc1NjQ4ODc0OX0.mock_signature';
      await AsyncStorage.setItem('@auth_token', mockToken);
      addResult('✓ 认证token已注入');
      
      // 注入访问token
      await AsyncStorage.setItem('@access_token', mockToken);
      addResult('✓ 访问token已注入');
      
      // 注入用户数据
      await AsyncStorage.setItem('@user_data', '{"id":"test_user_001","username":"testuser","phoneNumber":"13800138000","createdAt":"2025-08-28T17:33:14.934Z","lastLoginAt":"2025-08-28T17:33:15.010Z","password":"test123"}');
      addResult('✓ 用户详细数据已注入');
      
      addResult('\n测试数据注入完成！');
      addResult('现在可以使用以下账号登录:');
      addResult('用户名: testuser');
      addResult('密码: test123');
      
    } catch (error: any) {
      addResult(`注入测试数据失败: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testLogin = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('开始测试登录功能...');
    
    try {
      // 导入登录相关模块
      const { loginUser } = await import('@data/usecase/UserUseCase');
      const { store } = await import('@data/repository/store');
      
      // 使用测试用户登录
      const loginData = {
        username: 'testuser',
        password: 'test123'
      };
      
      addResult(`尝试登录用户: ${loginData.username}`);
      
      // 执行登录
      const loginResult = await store.dispatch(loginUser(loginData));
      
      if (loginResult.type.endsWith('/fulfilled')) {
        addResult('登录成功!');
        addResult(`用户: ${loginResult.payload.user.username}`);
        addResult(`Token: ${loginResult.payload.access_token.substring(0, 20)}...`);
        
        // 登录成功后测试翻译API
        await testTranslationAfterLogin();
      } else {
        addResult(`登录失败: ${loginResult.payload || '未知错误'}`);
      }
      
    } catch (error: any) {
      addResult(`登录过程中发生错误: ${error.message}`);
    }
    
    setIsLoading(false);
  };
  
  const testTranslationAfterLogin = async () => {
    addResult('\n=== 登录后测试翻译API ===');
    
    try {
      const translationResult = await TranslationApi.translateWord('1', 'hello');
      addResult(`翻译API成功: ${JSON.stringify(translationResult)}`);
    } catch (error: any) {
      addResult(`翻译API失败: ${error.message}`);
    }
  };

  const testTranslationAPI = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('开始测试翻译API...');
    
    // 检查认证状态
    try {
      const { httpClient } = await import('@data/api/HttpClient');
      const token = httpClient.getAccessToken();
      addResult(`当前Token状态: ${token ? '已设置' : '未设置'}`);
      if (token) {
        addResult(`Token长度: ${token.length}`);
        addResult(`Token前缀: ${token.substring(0, 20)}...`);
      }
      
      // 检查Redux认证状态
      const { useSelector } = await import('react-redux');
      const { RootState } = await import('@data/repository/store');
      // 由于这是在函数内部，我们需要通过store直接获取状态
      const { store } = await import('@data/repository/store');
      const authState = store.getState().auth;
      addResult(`Redux用户状态: ${authState.user ? '已登录' : '未登录'}`);
      addResult(`Redux Token状态: ${authState.token ? '已设置' : '未设置'}`);
      
      if (authState.user) {
        addResult(`用户名: ${authState.user.username}`);
        addResult(`用户ID: ${authState.user.id}`);
      }
      
      // 尝试从存储恢复token
      addResult('尝试从存储恢复Token...');
      await httpClient.restoreTokensFromStorage();
      const restoredToken = httpClient.getAccessToken();
      addResult(`恢复后Token状态: ${restoredToken ? '已设置' : '未设置'}`);
      
    } catch (error: any) {
      addResult(`获取Token失败: ${error.message}`);
    }
    
    // 首先测试服务器基本连接
    try {
      addResult('测试服务器基本连接...');
      
      const pingResponse = await fetch('https://masterwordai.com/', {
        method: 'GET',
        mode: 'cors'
      });
      
      addResult(`服务器连接状态: ${pingResponse.status} ${pingResponse.statusText}`);
      
    } catch (error: any) {
      addResult(`服务器连接失败: ${error.message}`);
    }
    
    try {
      // 测试不带认证的网络连接
      addResult('测试翻译API端点...');
      
      const testResponse = await fetch('https://masterwordai.com/test/english_word_search/1/hello', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      addResult(`翻译API响应状态: ${testResponse.status} ${testResponse.statusText}`);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        addResult(`翻译API错误响应: ${errorText}`);
      } else {
        const data = await testResponse.text();
        addResult(`翻译API成功响应: ${data}`);
      }
      
    } catch (error: any) {
      addResult(`翻译API网络错误: ${error.message}`);
      addResult(`错误类型: ${error.constructor.name}`);
      
      if (error.message.includes('CORS')) {
        addResult('检测到CORS错误!');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_FAILED') || error.message.includes('ERR_ABORTED')) {
        addResult('检测到网络连接错误!');
      }
    }
    
    // 测试带认证的请求
    try {
      addResult('测试带认证的API请求...');
      const { httpClient } = await import('@data/api/HttpClient');
      const token = httpClient.getAccessToken();
      
      if (!token) {
        addResult('警告: 没有认证Token，API请求可能失败');
      }
      
      const authResponse = await fetch('https://masterwordai.com/test/english_word_search/1/hello', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      addResult(`认证请求状态: ${authResponse.status} ${authResponse.statusText}`);
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        addResult(`认证请求错误: ${errorText}`);
      } else {
        const data = await authResponse.text();
        addResult(`认证请求成功: ${data}`);
      }
      
    } catch (error: any) {
      addResult(`认证请求错误: ${error.message}`);
    }
    
    // 测试不同的API端点
    try {
      addResult('测试其他API端点...');
      
      // 测试版本端点
      const versionResponse = await fetch('https://masterwordai.com/version', {
        method: 'GET',
        mode: 'cors'
      });
      
      addResult(`版本端点状态: ${versionResponse.status} ${versionResponse.statusText}`);
      
      if (versionResponse.ok) {
        const versionData = await versionResponse.text();
        addResult(`版本响应: ${versionData}`);
      }
      
    } catch (error: any) {
      addResult(`版本端点错误: ${error.message}`);
    }
    
    // 测试TranslationApi
    try {
      addResult('测试TranslationApi.translateWord...');
      
      const translationResult = await TranslationApi.translateWord('1', 'hello');
      addResult(`TranslationApi成功: ${translationResult}`);
      
    } catch (error: any) {
      addResult(`TranslationApi错误: ${error.message}`);
      addResult(`错误详情: ${JSON.stringify(error)}`);
    }
    
    setIsLoading(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 'bold',
    },
    resultsContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 15,
    },
    resultText: {
      color: theme.colors.text,
      fontSize: 12,
      marginBottom: 5,
      fontFamily: 'monospace',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>API 测试页面</Text>
      
      <Button
          title={isLoading ? '注入中...' : '注入测试数据'}
          onPress={injectTestData}
          disabled={isLoading}
        />
        
        <View style={{ marginTop: 10 }}>
          <Button
            title={isLoading ? '测试中...' : '测试登录+翻译'}
            onPress={testLogin}
            disabled={isLoading}
          />
        </View>
        
        <View style={{ marginTop: 10 }}>
          <Button
            title={isLoading ? '测试中...' : '仅测试翻译API'}
            onPress={testTranslationAPI}
            disabled={isLoading}
          />
        </View>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}