//This layout is only for the tab-based screens, which is perfect.
import { Tabs } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { designTokensColors as c } from '../../constants/designTokens';
import { spacing as s, typography as t } from '../../constants/designTokens';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.bgCream }}>
        <ActivityIndicator size="large" color={c.primary} />
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
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.bgCream,
          borderTopWidth: 1,
          borderTopColor: c.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: s.bottomNavPaddingTop,
        },
        tabBarLabelStyle: {
          fontSize: t.fontSize.tabLabel,
          fontWeight: t.fontWeight.bold,
          letterSpacing: 1,
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