import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';

import { store } from './data/repository/store';
import { SafeJsonUtils } from './utils/SafeJsonUtils';
import { darkTheme, lightTheme } from './constants/theme';
import { safeRegisterWechatApp } from './utils/wechat';

// 在应用启动时清理损坏的数据
const initializeApp = async () => {
  try {
    await SafeJsonUtils.cleanupAsyncStorage();
  } catch (error: any) {
    console.error('应用初始化失败:', error);
  }
};

export default function App() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    // WeChat SDK registration (required before calling WeChat APIs)
    safeRegisterWechatApp({
      appid: 'wx778c1735212de08a',
      // iOS required; should be a real universal link domain in production
      universalLink: 'https://temporary_link.com/',
    });
  }, []);

  React.useEffect(() => {
    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <PaperProvider theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
            <Slot />
          </PaperProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}