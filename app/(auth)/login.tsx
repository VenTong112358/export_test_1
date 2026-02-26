import { safeIsWechatInstalled, safeSendWechatAuthRequest } from '@/utils/wechat';
import { AppDispatch, RootState } from '@data/repository/store';
import { clearDailyLearningLogsCache, fetchDailyLearningLogs, resetLogs } from '@data/usecase/DailyLearningLogsUseCase';
import { loginUser, loginWithWeChat, setUser, STORAGE_KEYS } from '@data/usecase/UserUseCase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Platform,
    TextInput as RNTextInput,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    designTokensColors as c,
    typography as t
} from '../../constants/designTokens';
import { recipes } from '../../constants/recipes';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [showTestButton, setShowTestButton] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header: slogan + title 仝文馆 — same as register */}
      <View style={styles.header}>
        <Text style={recipes.auth.subtitle}>VenTong —— 沉浸语境，词自成章</Text>
        <Text style={[recipes.auth.title, styles.headerTitleChinese]}>仝文馆</Text>
        <View style={recipes.auth.divider} />
      </View>

      {/* Main: form — matches flex-grow justify-center max-w-sm mx-auto my-8 */}
      <View style={styles.main}>
        <View style={styles.centeredBlock}>
          {formError ? <Text style={styles.error}>{formError}</Text> : null}

        {/* 用户名 */}
        <View style={styles.inputSection}>
          <Text style={recipes.form.inputLabel}>用户名</Text>
          <View
            style={[
              styles.inputUnderlineWrap,
              { borderBottomColor: usernameFocused ? c.primary : c.border },
            ]}
          >
            <RNTextInput
              value={username}
              onChangeText={setUsername}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              style={styles.inputText}
              placeholder="请输入用户名"
              placeholderTextColor={c.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* 密码 */}
        <View style={styles.inputSection}>
          <Text style={recipes.form.inputLabel}>密码</Text>
          <View
            style={[
              styles.inputUnderlineWrap,
              { borderBottomColor: passwordFocused ? c.primary : c.border },
            ]}
          >
            <RNTextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              style={styles.inputText}
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setShowPassword((v) => !v)}
              style={styles.passwordToggle}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={c.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Log In */}
        <View style={styles.primaryButtonWrap}>
          <TouchableOpacity
            style={recipes.button.primaryCtaLarge}
            onPress={handleLogin}
            disabled={loading || wechatLoading}
            activeOpacity={0.9}
          >
            <Text style={recipes.button.primaryCtaLargeText}>
              {loading ? '…' : '登录'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Or */}
        <View style={[recipes.form.dividerRow, styles.dividerWrap]}>
          <View style={recipes.form.dividerLine} />
          <Text style={recipes.form.dividerText}>或</Text>
          <View style={recipes.form.dividerLine} />
        </View>

        {/* 微信登录 */}
        <TouchableOpacity
          style={recipes.button.wechatOutline}
          onPress={handleWeChatLogin}
          disabled={loading || wechatLoading}
          activeOpacity={0.9}
        >
          <Text style={recipes.button.wechatOutlineText}>
            {wechatLoading ? '…' : '微信登录'}
          </Text>
        </TouchableOpacity>

        {showTestButton && (
          <TouchableOpacity
            style={[recipes.button.primaryCta, styles.testButton]}
            onPress={() => router.push('/debug/test-daily-log-request')}
          >
            <Text style={recipes.button.primaryCtaText}>Test Daily Log API</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>

      {/* Footer — same as register */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/forgot' as any)}>
          <Text style={recipes.link.footer}>忘记密码？</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerLinkSpacing}
          onPress={() => router.push('/(auth)/register' as any)}
        >
          <Text style={recipes.link.footerHighlight}>没有账号？去注册</Text>
        </TouchableOpacity>
        <View style={styles.footerMutedWrap}>
          <Text style={recipes.link.footerMuted}>Est. MMXXIV</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Layout matches reference: body px-8 py-10, header mt-8, main my-8 max-w-sm, form space-y-6, footer mt-4 pb-8
const PX_8 = 32;
const PY_10 = 40;
const MT_8 = 32;
const MY_8 = 32;
const SPACE_Y_6 = 24;
const PT_4 = 16;
const SPACE_Y_4 = 16;
const MT_4 = 16;
const PB_8 = 32;
const PT_8 = 32;
const MAX_W_SM = 384;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: PX_8,
    paddingTop: PY_10,
    paddingBottom: PB_8,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MAX_W_SM,
    alignSelf: 'center',
    marginVertical: MY_8,
  },
  centeredBlock: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: MT_8,
  },
  /** 仝文馆：使用中文字体完整显示，与 register 一致 */
  headerTitleChinese: {
    fontFamily: t.fontFamily.serifChinese,
    fontStyle: 'normal',
  },
  inputSection: {
    marginBottom: SPACE_Y_6,
  },
  inputUnderlineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 18,
    fontFamily: t.fontFamily.serif,
    color: c.primary,
    padding: 0,
    margin: 0,
    minHeight: 28,
  },
  passwordToggle: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  primaryButtonWrap: {
    marginTop: PT_4,
    marginBottom: SPACE_Y_4,
  },
  dividerWrap: {
    marginBottom: SPACE_Y_4,
  },
  testButton: {
    marginTop: SPACE_Y_4,
  },
  error: {
    color: c.primary,
    fontSize: t.fontSize.bodyMeta,
    marginBottom: SPACE_Y_4,
    textAlign: 'center',
  },
  footer: {
    marginTop: MT_4,
    alignItems: 'center',
  },
  footerLinkSpacing: {
    marginTop: SPACE_Y_4,
  },
  footerMutedWrap: {
    marginTop: PT_8,
    paddingTop: PT_8,
  },
});


