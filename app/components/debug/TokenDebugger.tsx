import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { HttpClient } from '@data/api/HttpClient';

const TokenDebugger = () => {
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const handleShowTokens = () => {
    const httpClient = HttpClient.getInstance();
    setAccessToken(httpClient.getAccessToken() || '');
    setRefreshToken(httpClient['refreshToken'] || '');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Button title="Show Tokens" onPress={handleShowTokens} />
      <Text style={{ marginTop: 16, fontWeight: 'bold' }}>Access Token:</Text>
      <Text selectable style={{ fontSize: 12 }}>{accessToken}</Text>
      <Text style={{ marginTop: 16, fontWeight: 'bold' }}>Refresh Token:</Text>
      <Text selectable style={{ fontSize: 12 }}>{refreshToken}</Text>
    </ScrollView>
  );
};

export default TokenDebugger;
