import React from 'react';
import { View } from 'react-native';
import TokenDebugger from '../../components/debug/TokenDebugger';

export default function TokenDebugPage() {
  return (
    <View style={{ flex: 1 }}>
      <TokenDebugger />
    </View>
  );
}