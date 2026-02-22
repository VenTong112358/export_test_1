import { safeIsWechatInstalled, safeSendWechatAuthRequest } from '@/utils/wechat';
import { AppDispatch, RootState } from '@data/repository/store';
import { clearDailyLearningLogsCache, fetchDailyLearningLogs, resetLogs } from '@data/usecase/DailyLearningLogsUseCase';
import { loginUser, loginWithWeChat, setUser, STORAGE_KEYS } from '@data/usecase/UserUseCase';
import { useTheme } from '@hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [showTestButton, setShowTestButton] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setFormError('请输入用户名和密码');
      return;
    }
    setFormError('');
    try {
      await dispatch(loginUser({ username, password })).unwrap();
      router.replace('/(tabs)/MainPage' as any);
      setShowTestButton(true);
    } catch (e: any) {
      setFormError(e?.message || e || '登录失败');
    }
  };

  const handleWeChatLogin = async () => {
    if (Platform.OS === 'web') {
      setFormError('网页端不支持微信登录');
      return;
    }
    if (wechatLoading || loading) return;

    setWechatLoading(true);
    setFormError('');
    try {
      console.log('[WeChatLogin] start');
      const installed = await safeIsWechatInstalled();
      console.log('[WeChatLogin] isWechatInstalled:', installed);
      if (!installed) {
        Alert.alert('WeChat 未安装', '请先安装微信后再使用微信登录');
        return;
      }

      console.log('[WeChatLogin] launching sendAuthRequest...');
      const authResp = await safeSendWechatAuthRequest({ scope: 'snsapi_userinfo', state: 'masterwordai' });
      console.log('[WeChatLogin] authResp received:', authResp?.data ? { hasCode: !!authResp.data.code } : authResp);
      const code = authResp?.data?.code;
      if (!code) {
        throw new Error('WeChat auth did not return a code');
      }
      console.log('[WeChatLogin] code received, calling backend...');

      // Clear daily logs cache/state to avoid cross-account leakage
      dispatch(resetLogs());
      dispatch(clearDailyLearningLogsCache());

      const result = await dispatch(loginWithWeChat({ code })).unwrap();
      console.log('[WeChatLogin] backend result:', { authFlow: result.authFlow });

      if (result.authFlow === 'login') {
        // Requirement: call daily_learning_logs API directly on login flow
        const logsResp = await dispatch(fetchDailyLearningLogs(result.user.username)).unwrap();

        // Infer numeric user_id from daily logs if available (improves compatibility with features that cast user.id to number)
        const inferredUserId =
          Array.isArray((logsResp as any)?.logs) && (logsResp as any).logs.length > 0
            ? (logsResp as any).logs[0]?.user_id
            : undefined;

        if (inferredUserId) {
          const updatedUser = {
            ...result.user,
            id: String(inferredUserId),
            username: result.user.username === 'wechat_user' ? `wechat_${inferredUserId}` : result.user.username,
          };
          dispatch(setUser(updatedUser));
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
        }

        router.replace('/(tabs)/MainPage' as any);
        setShowTestButton(true);
      } else {
        // register flow: go to existing onboarding wordbook selection
        router.replace('/(auth)/onboarding-wordbook' as any);
      }
    } catch (e: any) {
      const msg = e?.message || e || '微信登录失败';
      const str = String(msg);
      setFormError(str);
      if (str.includes("Cannot find native module 'ExpoNativeWechat'")) {
        Alert.alert(
          '微信登录不可用',
          '你现在运行的是 Expo Go（或当前安装包未包含 expo-native-wechat 原生模块）。\n\n' +
            '请用 Development Build 运行：\n' +
            '- Android: `npm run android`\n' +
            '- iOS: `npm run ios`'
        );
      } else if (str.includes('SendAuthResp timed out')) {
        Alert.alert(
          '微信登录超时',
          '已成功发起微信授权请求，但应用没有收到微信回调（没有拿到 code）。\n\n' +
            '这通常是 Android 端微信开放平台配置不匹配导致：\n' +
            '- 包名必须是 `com.masterwordai.tongwenguan`\n' +
            '- 签名必须是当前安装包的签名（debug/dev build 和 release 不同）\n\n' +
            '请用 `./gradlew signingReport` 获取 SHA1/MD5，并在微信开放平台后台更新后重试。'
        );
      }
    } finally {
      setWechatLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>登录</Text>
          <Text style={styles.subtitle}>欢迎回来！登录以继续你的阅读之旅。</Text>
        </View>
        {formError ? (
          <Text style={styles.error}>{formError}</Text>
        ) : null}
        {/* Username Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>用户名</Text>
          </View>
          <TextInput
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            placeholder="请输入用户名"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>密码</Text>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} />}
            placeholder="请输入密码"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Forget Password */}
        <View style={styles.forgetPasswordContainer}>
          <Button labelStyle={{ color: '#838589' }} mode="text" onPress={() => router.push('/forgot' as any)}>
            忘记密码？
          </Button>
        </View>
        {/* Login Button */}
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          contentStyle={styles.loginButtonContent}
          labelStyle={styles.loginButtonLabel}
          loading={loading}
          disabled={loading || wechatLoading}
        >
          登录
        </Button>
        <Button
          mode="contained"
          icon="wechat"
          style={[styles.loginButton, styles.wechatButton, { marginTop: 0 }]}
          contentStyle={styles.loginButtonContent}
          labelStyle={styles.loginButtonLabel}
          onPress={handleWeChatLogin}
          loading={wechatLoading}
          disabled={loading || wechatLoading}
        >
          微信登录
        </Button>
        {showTestButton && (
          <Button
            mode="contained"
            style={{ marginTop: 20, backgroundColor: '#007AFF' }}
            onPress={() => router.push('/debug/test-daily-log-request')}
          >
            Test Daily Log API
          </Button>
        )}
        <Button
          mode="text"
          onPress={() => router.push('/(auth)/register' as any)}
          style={styles.button}
          labelStyle={{ color: '#838589' }}
        >
          没有账号？去注册
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFBF8',
  },
  content: {
    paddingHorizontal: width * 0.12,
  },
  titleSection: {
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: 32,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    color: '#0C1A30',
    fontWeight: 'bold',
    marginBottom: height * 0.01,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
  },
  inputSection: {
    marginBottom: height * 0.03,
  },
  inputLabel: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: height * 0.01,
  },
  labelText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
  },
  input: {
    backgroundColor: '#EDEDED',
    borderRadius: 12,
  },
  inputContent: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
  },
  inputOutline: {
    borderWidth: 0,
  },
  loginButton: {
    backgroundColor: '#FC9B33',
    borderRadius: 12,
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
    shadowColor: '#FC9B33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonContent: {
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.04,
  },
  loginButtonLabel: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  button: {
    marginTop: 8,
  },
  wechatButton: {
    backgroundColor: '#07C160',
    marginTop: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#757575',
  },
  forgetPasswordContainer: {
    alignItems: 'flex-end',
  },
  loginTypeSection: {
    marginBottom: height * 0.03,
  },
  segmentedButtons: {
    backgroundColor: '#F5F5F5',
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
  sendCodeButton: {
    borderColor: '#FC9B33',
    borderRadius: 8,
    minWidth: 100,
  },
  sendCodeButtonLabel: {
    color: '#FC9B33',
    fontSize: 12,
  },
});


