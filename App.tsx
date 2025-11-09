import React from 'react';
import { Provider } from 'react-redux';
import { store } from './data/repository/store';
import { SafeJsonUtils } from './utils/SafeJsonUtils';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './constants/theme';

// GestureHandlerRootView can ONLY be imported from 'react-native-gesture-handler' (no such export from 'react-native').
import { GestureHandlerRootView } from 'react-native-gesture-handler';


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