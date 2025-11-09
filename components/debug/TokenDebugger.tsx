import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpClient } from '../../data/api/HttpClient';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'my-very-secret-key-masteraiwords';
const REFRESH_TOKEN_KEY = '@refresh_token';
const ACCESS_TOKEN_KEY = '@access_token';

// 解密函数（与HttpClient中的相同）
function decryptData(ciphertext: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// JWT解析函数
function parseJWT(token: string): any {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT解析失败:', error);
    return null;
  }
}

interface TokenInfo {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenFromStorage: string | null;
  refreshTokenFromStorage: string | null;
  refreshTokenDecrypted: string | null;
  refreshTokenPayload: any;
  accessTokenPayload: any;
}

export default function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    accessToken: null,
    refreshToken: null,
    accessTokenFromStorage: null,
    refreshTokenFromStorage: null,
    refreshTokenDecrypted: null,
    refreshTokenPayload: null,
    accessTokenPayload: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const loadTokenInfo = async () => {
    try {
      // 从HttpClient获取当前token
      const accessToken = httpClient.getAccessToken();
      
      // 从存储获取原始数据
      const accessTokenFromStorage = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshTokenFromStorage = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      // 尝试解密refresh token
      let refreshTokenDecrypted = null;
      if (refreshTokenFromStorage) {
        refreshTokenDecrypted = decryptData(refreshTokenFromStorage);
      }
      
      // 解析JWT payload
      const accessTokenPayload = parseJWT(accessToken);
      const refreshTokenPayload = parseJWT(refreshTokenDecrypted);
      
      setTokenInfo({
        accessToken,
        refreshToken: null, // HttpClient的refreshToken是私有的，无法直接获取
        accessTokenFromStorage,
        refreshTokenFromStorage,
        refreshTokenDecrypted,
        accessTokenPayload,
        refreshTokenPayload,
      });
    } catch (error) {
      console.error('加载token信息失败:', error);
      Alert.alert('错误', '加载token信息失败: ' + error.message);
    }
  };

  const testRefreshToken = async () => {
    setIsRefreshing(true);
    setRefreshResult('');
    setDebugInfo('');
    
    try {
      console.log('🧪 [TokenDebugger] 开始测试token刷新');
      
      // 显示调试信息
      const refreshTokenFromStorage = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const refreshTokenDecrypted = refreshTokenFromStorage ? decryptData(refreshTokenFromStorage) : null;
      const refreshTokenPayload = parseJWT(refreshTokenDecrypted);
      
      let debugText = '🔍 调试信息:\n';
       debugText += `Refresh Token存在: ${!!refreshTokenDecrypted}\n`;
       debugText += `Refresh Token长度: ${refreshTokenDecrypted ? refreshTokenDecrypted.length : 0}\n`;
       debugText += `Refresh Token格式: ${refreshTokenDecrypted ? (refreshTokenDecrypted.split('.').length === 3 ? 'JWT格式正确' : 'JWT格式错误') : '无'}\n`;
       
       // 添加更详细的解密和解析信息
       debugText += `原始加密Token: ${refreshTokenFromStorage ? refreshTokenFromStorage.substring(0, 50) + '...' : '无'}\n`;
       debugText += `解密是否成功: ${refreshTokenDecrypted ? '是' : '否'}\n`;
       debugText += `JWT解析是否成功: ${refreshTokenPayload ? '是' : '否'}\n`;
       
       if (refreshTokenPayload) {
         debugText += `Token过期时间: ${refreshTokenPayload.exp ? new Date(refreshTokenPayload.exp * 1000).toLocaleString() : '未知'}\n`;
         debugText += `Token是否过期: ${refreshTokenPayload.exp && Date.now() > refreshTokenPayload.exp * 1000 ? '是' : '否'}\n`;
         debugText += `用户ID: ${refreshTokenPayload.user_id || '未知'}\n`;
       } else if (refreshTokenDecrypted) {
         debugText += `解析失败原因: JWT格式可能不正确\n`;
         debugText += `Token前50字符: ${refreshTokenDecrypted.substring(0, 50)}\n`;
       }
       
       debugText += `请求体内容: {"refresh_token": "${refreshTokenDecrypted ? refreshTokenDecrypted.substring(0, 30) + '...' : 'null'}"}\n`;
       debugText += `API端点: /test/refresh\n`;
      
      setDebugInfo(debugText);
      
      const newToken = await httpClient.refreshAccessToken();
      setRefreshResult(`✅ 刷新成功！新token: ${newToken.substring(0, 50)}...`);
      // 重新加载token信息
      await loadTokenInfo();
    } catch (error) {
      console.error('🧪 [TokenDebugger] 刷新失败:', error);
      setRefreshResult(`❌ 刷新失败: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearAllTokens = async () => {
    try {
      await httpClient.clearTokensFromStorage();
      await loadTokenInfo();
      Alert.alert('成功', '所有token已清除');
    } catch (error) {
      Alert.alert('错误', '清除token失败: ' + error.message);
    }
  };

  const validateRefreshToken = async () => {
    try {
      const refreshTokenFromStorage = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshTokenFromStorage) {
        Alert.alert('错误', 'Refresh Token不存在');
        return;
      }

      const refreshTokenDecrypted = decryptData(refreshTokenFromStorage);
      if (!refreshTokenDecrypted) {
        Alert.alert('错误', 'Refresh Token解密失败');
        return;
      }

      // 验证JWT格式
      const parts = refreshTokenDecrypted.split('.');
      if (parts.length !== 3) {
        Alert.alert('格式错误', `JWT应该有3部分，但实际有${parts.length}部分\n\nToken内容: ${refreshTokenDecrypted}`);
        return;
      }

      // 尝试解析payload
      const payload = parseJWT(refreshTokenDecrypted);
      if (!payload) {
        Alert.alert('解析失败', `JWT payload解析失败\n\nPayload部分: ${parts[1]}`);
        return;
      }

      const isExpired = payload.exp && Date.now() > payload.exp * 1000;
      const expireTime = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '未知';
      
      Alert.alert('Token验证结果', 
        `格式: 正确\n` +
        `过期时间: ${expireTime}\n` +
        `是否过期: ${isExpired ? '是' : '否'}\n` +
        `用户ID: ${payload.user_id || '未知'}`
      );
    } catch (error) {
      Alert.alert('验证失败', error.message);
    }
  };

  useEffect(() => {
    loadTokenInfo();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Token 调试器
      </Text>
      
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Token 状态</Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>HttpClient Access Token:</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.accessToken ? `${tokenInfo.accessToken.substring(0, 50)}...` : '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>存储中的 Access Token:</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.accessTokenFromStorage ? `${tokenInfo.accessTokenFromStorage.substring(0, 50)}...` : '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>存储中的 Refresh Token (加密):</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.refreshTokenFromStorage ? `${tokenInfo.refreshTokenFromStorage.substring(0, 50)}...` : '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>解密后的 Refresh Token:</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.refreshTokenDecrypted ? `${tokenInfo.refreshTokenDecrypted.substring(0, 50)}...` : '无或解密失败'}
        </Text>
        
        {tokenInfo.accessTokenPayload && (
          <>
            <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold', color: '#007AFF' }}>Access Token 信息:</Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
              过期时间: {tokenInfo.accessTokenPayload.exp ? new Date(tokenInfo.accessTokenPayload.exp * 1000).toLocaleString() : '未知'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
              用户ID: {tokenInfo.accessTokenPayload.user_id || '未知'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              是否过期: {tokenInfo.accessTokenPayload.exp && Date.now() > tokenInfo.accessTokenPayload.exp * 1000 ? '是' : '否'}
            </Text>
          </>
        )}
        
        {tokenInfo.refreshTokenPayload && (
          <>
            <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold', color: '#FF9500' }}>Refresh Token 信息:</Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
              过期时间: {tokenInfo.refreshTokenPayload.exp ? new Date(tokenInfo.refreshTokenPayload.exp * 1000).toLocaleString() : '未知'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>
              用户ID: {tokenInfo.refreshTokenPayload.user_id || '未知'}
            </Text>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
              是否过期: {tokenInfo.refreshTokenPayload.exp && Date.now() > tokenInfo.refreshTokenPayload.exp * 1000 ? '是' : '否'}
            </Text>
          </>
        )}
      </View>
      
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>操作</Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
            opacity: isRefreshing ? 0.6 : 1
          }}
          onPress={testRefreshToken}
          disabled={isRefreshing}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {isRefreshing ? '刷新中...' : '测试 Token 刷新'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#34C759',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={loadTokenInfo}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            重新加载 Token 信息
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#FF9500',
            padding: 15,
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={validateRefreshToken}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            验证 Refresh Token 格式
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#FF3B30',
            padding: 15,
            borderRadius: 8
          }}
          onPress={clearAllTokens}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            清除所有 Token
          </Text>
        </TouchableOpacity>
      </View>
      
      {debugInfo ? (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>调试信息</Text>
          <Text style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
            {debugInfo}
          </Text>
        </View>
      ) : null}
      
      {refreshResult ? (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>刷新结果</Text>
          <Text style={{ fontSize: 14, color: refreshResult.startsWith('✅') ? '#34C759' : '#FF3B30' }}>
            {refreshResult}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}