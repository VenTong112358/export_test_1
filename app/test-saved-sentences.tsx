import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SentenceFavoriteApi } from '../data/api/SentenceFavoriteApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestSavedSentences() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      setToken(accessToken);
      console.log('🔍 [TestSavedSentences] Current token:', accessToken);
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [TestSavedSentences] Testing saved sentences API...');
      const api = SentenceFavoriteApi.getInstance();
      const result = await api.getSavedSentences();
      console.log('✅ [TestSavedSentences] API result:', result);
      setData(result);
    } catch (err: any) {
      console.error('❌ [TestSavedSentences] API error:', err);
      setError(err.message || 'API调用失败');
    } finally {
      setLoading(false);
    }
  };

  const testGroupedAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [TestSavedSentences] Testing grouped saved sentences API...');
      const api = SentenceFavoriteApi.getInstance();
      const result = await api.getSavedSentencesByArticle();
      console.log('✅ [TestSavedSentences] Grouped API result:', result);
      setData(result);
    } catch (err: any) {
      console.error('❌ [TestSavedSentences] Grouped API error:', err);
      setError(err.message || 'API调用失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>测试收藏句子API</Text>
      </View>

      <View style={styles.tokenSection}>
        <Text style={styles.sectionTitle}>当前Token:</Text>
        <Text style={styles.tokenText}>{token ? token.substring(0, 50) + '...' : '无Token'}</Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试基础API</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testGroupedAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>测试分组API</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultSection}>
        {loading && <Text style={styles.loadingText}>加载中...</Text>}
        {error && <Text style={styles.errorText}>错误: {error}</Text>}
        {data && (
          <View>
            <Text style={styles.sectionTitle}>API返回数据:</Text>
            <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F6',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    fontSize: 16,
    color: '#FC9B33',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonSection: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FC9B33',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#FC9B33',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff0000',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});