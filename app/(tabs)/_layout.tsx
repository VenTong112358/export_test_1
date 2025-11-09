//This layout is only for the tab-based screens, which is perfect.
import { Tabs } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

function TabBarIcon(props: {// OK了就是复用定义icon的组件
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: 3 }} {...props} />;
}

export default function TabsLayout() {
  const { user, status } = useSelector((state: RootState) => state.auth);
  const { restoreAuthFromStorage } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[TabsLayout] Checking authentication...');
        const hasAuth = await restoreAuthFromStorage();
        console.log('[TabsLayout] Has auth:', hasAuth);
      } catch (error) {
        console.error('[TabsLayout] Error checking auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // 如果正在检查认证状态，显示加载指示器
  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF8' }}>
        <ActivityIndicator size="large" color="#FC9B33" />
      </View>
    );
  }

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    console.log('[TabsLayout] User not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('[TabsLayout] User authenticated, showing tabs');

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#F28F26',
        tabBarInactiveTintColor: '#200E32',
        tabBarStyle: {
          backgroundColor: '#FFFBF8',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.05)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'DM Sans',
          fontWeight: '500',
        }
      }}
    >
      <Tabs.Screen
        name="MainPage"
        options={{
          title: '文章',
          tabBarIcon: ({ color }) => <TabBarIcon name="newspaper" color={color} />,
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: '单词',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />

    </Tabs>
  );
} 