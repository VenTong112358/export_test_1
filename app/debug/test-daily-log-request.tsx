import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { HttpClient } from '@data/api/HttpClient';
import { useRouter } from 'expo-router';

export default function TestDailyLogRequest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const router = useRouter();

  const showTokens = () => {
    const httpClient = HttpClient.getInstance();
    setAccessToken(httpClient.getAccessToken() || '');
    // @ts-ignore: access private for debug
    setRefreshToken(httpClient['refreshToken'] || '');
  };

  const fetchDailyLog = async () => {
    setLoading(true);
    setResult('');
    setError('');
    try {
      const httpClient = HttpClient.getInstance();
      const token = httpClient.getAccessToken();
      if (!token) {
        setError('No access token found. Please login first.');
        setLoading(false);
        return;
      }
      // Use HttpClient's get method
      const response = await httpClient.get<any>('/daily_learning_logs');
      setResult(typeof response === 'string' ? response : JSON.stringify(response, null, 2));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Restore tokens and show them, then fetch logs
    HttpClient.getInstance().restoreTokensFromStorage().then(() => {
      showTokens();
      fetchDailyLog();
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ width: '100%', alignItems: 'flex-start', marginTop: 40, marginBottom: 8 }}>
        <Button title="Back" onPress={() => router.back()} color="#007AFF" />
      </View>
      <Text style={styles.title}>Test Daily Learning Logs API</Text>
      <Button title="Retry API Request" onPress={fetchDailyLog} disabled={loading} />
      <View style={{ marginVertical: 16, width: '100%' }}>
        <Button title="Show Current Tokens" onPress={showTokens} />
        <Text style={styles.tokenLabel}>Access Token:</Text>
        <Text style={styles.tokenValue}>{accessToken ? accessToken : '(none)'}</Text>
        <Text style={styles.tokenLabel}>Refresh Token:</Text>
        <Text style={styles.tokenValue}>{refreshToken ? refreshToken : '(none)'}</Text>
      </View>
      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
      {result ? (
        <Text style={styles.result}>{result}</Text>
      ) : null}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  result: {
    marginTop: 20,
    color: '#222',
    fontSize: 14,
  },
  error: {
    marginTop: 20,
    color: 'red',
    fontSize: 14,
  },
  tokenLabel: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#555',
    fontSize: 13,
  },
  tokenValue: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});
