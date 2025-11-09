import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpClient } from '../data/api/HttpClient';
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'my-very-secret-key-masteraiwords';
const REFRESH_TOKEN_KEY = '@refresh_token';
const ACCESS_TOKEN_KEY = '@access_token';

function decryptData(ciphertext: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

function parseJWT(token: string): any {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    return null;
  }
}

export default function TokenDebugger() {
  const [tokenInfo, setTokenInfo] = useState<any>({});
  const [refreshResult, setRefreshResult] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        accessTokenFromStorage,
        refreshTokenFromStorage: refreshTokenFromStorage ? refreshTokenFromStorage.substring(0, 50) + '...' : null,
        refreshTokenDecrypted: refreshTokenDecrypted ? refreshTokenDecrypted.substring(0, 50) + '...' : null,
        accessTokenPayload,
        refreshTokenPayload,
        accessTokenExpired: accessTokenPayload?.exp ? Date.now() > accessTokenPayload.exp * 1000 : null,
        refreshTokenExpired: refreshTokenPayload?.exp ? Date.now() > refreshTokenPayload.exp * 1000 : null,
      });
    } catch (error) {
      console.error('加载token信息失败:', error);
      Alert.alert('错误', '加载token信息失败: ' + error.message);
    }
  };

  const testRefreshToken = async () => {
    setIsRefreshing(true);
    setRefreshResult('');
    
    try {
      console.log('🧪 开始测试token刷新');
      const newToken = await httpClient.refreshAccessToken();
      setRefreshResult(`✅ 刷新成功！新token: ${newToken.substring(0, 50)}...`);
      await loadTokenInfo();
    } catch (error) {
      console.error('🧪 刷新失败:', error);
      setRefreshResult(`❌ 刷新失败: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const restoreTokens = async () => {
    try {
      await httpClient.restoreTokensFromStorage();
      await loadTokenInfo();
      Alert.alert('成功', 'Token已从存储恢复');
    } catch (error) {
      Alert.alert('错误', '恢复token失败: ' + error.message);
    }
  };

  useEffect(() => {
    loadTokenInfo();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Token 调试器</Text>
      
      <TouchableOpacity 
        onPress={loadTokenInfo}
        style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>刷新Token信息</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={restoreTokens}
        style={{ backgroundColor: '#34C759', padding: 10, borderRadius: 5, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>从存储恢复Token</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={testRefreshToken}
        disabled={isRefreshing}
        style={{ 
          backgroundColor: isRefreshing ? '#ccc' : '#FF9500', 
          padding: 10, 
          borderRadius: 5, 
          marginBottom: 20 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {isRefreshing ? '刷新中...' : '测试Token刷新'}
        </Text>
      </TouchableOpacity>

      {refreshResult ? (
        <View style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5, marginBottom: 20 }}>
          <Text style={{ fontSize: 14 }}>{refreshResult}</Text>
        </View>
      ) : null}

      <View style={{ backgroundColor: '#f9f9f9', padding: 15, borderRadius: 5 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Token 状态</Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>Access Token (HttpClient):</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.accessToken ? `${tokenInfo.accessToken.substring(0, 50)}...` : '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>Access Token (存储):</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.accessTokenFromStorage ? `${tokenInfo.accessTokenFromStorage.substring(0, 50)}...` : '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>Refresh Token (加密):</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.refreshTokenFromStorage || '无'}
        </Text>
        
        <Text style={{ fontSize: 14, marginBottom: 5, fontWeight: 'bold' }}>Refresh Token (解密):</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
          {tokenInfo.refreshTokenDecrypted || '无或解密失败'}
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
            <Text style={{ fontSize: 12, color: tokenInfo.accessTokenExpired ? '#FF3B30' : '#34C759', marginBottom: 10 }}>
              状态: {tokenInfo.accessTokenExpired ? '已过期' : '有效'}
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
            <Text style={{ fontSize: 12, color: tokenInfo.refreshTokenExpired ? '#FF3B30' : '#34C759', marginBottom: 10 }}>
              状态: {tokenInfo.refreshTokenExpired ? '已过期' : '有效'}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}