import { PrivacyPolicyModal } from '@/app/components/PrivacyPolicyModal';
import { safeIsWechatInstalled, safeSendWechatAuthRequest } from '@/utils/wechat';
import { SmsApi } from '@data/api/SmsApi';
import { AppDispatch } from '@data/repository/store';
import { clearDailyLearningLogsCache, fetchDailyLearningLogs, resetLogs } from '@data/usecase/DailyLearningLogsUseCase';
import { loginWithWeChat, setUser, STORAGE_KEYS } from '@data/usecase/UserUseCase';
import { Ionicons } from '@expo/vector-icons';
import { usePrivacyPolicyAgreement } from '@hooks/usePrivacyPolicyAgreement';
import { useTheme } from '@hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import {
  designTokensColors as c,
  typography as t
} from '../../constants/designTokens';
import { recipes } from '../../constants/recipes';

// Layout: body px-8 py-10, header mt-8, main my-8 max-w-sm, form space-y-6, footer mt-4 pb-8
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

export default function RegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [verifyPasswordFocused, setVerifyPasswordFocused] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const router = useRouter();
  const smsApi = SmsApi.getInstance();
  const { hasAccepted: privacyPolicyAccepted, isLoading: privacyPolicyLoading, acceptPrivacyPolicy } = usePrivacyPolicyAgreement();

  useEffect(() => {
    if (!privacyPolicyLoading && privacyPolicyAccepted === false) {
      setShowPrivacyModal(true);
    }
  }, [privacyPolicyLoading, privacyPolicyAccepted]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (pass: string) => {
    return pass.length >= 8 && /[A-Za-z]/.test(pass) && /[0-9]/.test(pass);
  };

  const handleAcceptPrivacyPolicy = async () => {
    try {
      await acceptPrivacyPolicy();
      setShowPrivacyModal(false);
      setAcceptedTerms(true);
    } catch (error) {
      console.error('Error accepting privacy policy:', error);
      setFormError('无法保存隐私政策同意状态，请重试');
    }
  };

  const handleDeclinePrivacyPolicy = () => {
    console.log('[Register] User declined privacy policy, exiting app');
    BackHandler.exitApp();
  };

  const handleSmsRegister = async () => {
    setFormError('');
    if (!username || !password || !phoneNumber) {
      setFormError('请填写用户名、密码、手机号');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setFormError('请输入有效的中国手机号');
      return;
    }
    if (!password) {
      setFormError('请输入密码');
      return;
    }
    if (!verifyPassword) {
      setFormError('请再次输入密码');
      return;
    }
    if (!validatePassword(password)) {
      setFormError('密码必须至少8位，且包含字母和数字');
      return;
    }
    if (password !== verifyPassword) {
      setFormError('两次输入的密码不一致');
      return;
    }
    if (!acceptedTerms) {
      setFormError('请接受隐私政策');
      return;
    }
    try {
      setSmsLoading(true);
      await smsApi.sendVerificationCode({
        phone_number: phoneNumber,
        purpose: 'register'
      });
      router.push({
        pathname: '/(auth)/sms-verification',
        params: {
          phoneNumber,
          purpose: 'register',
          username,
          password,
        }
      });
    } catch (error: any) {
      setFormError(error.message || '发送验证码失败');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleWeChatRegister = async () => {
    if (Platform.OS === 'web') {
      setFormError('网页端不支持微信登录');
      return;
    }
    if (wechatLoading || smsLoading) return;

    setWechatLoading(true);
    setFormError('');
    try {
      const installed = await safeIsWechatInstalled();
      if (!installed) {
        Alert.alert('微信未安装', '请先安装微信后再使用微信注册');
        return;
      }

      const authResp = await safeSendWechatAuthRequest({ scope: 'snsapi_userinfo', state: 'masterwordai' });
      const code = authResp?.data?.code;
      if (!code) {
        throw new Error('微信授权未返回 code');
      }

      dispatch(resetLogs());
      dispatch(clearDailyLearningLogsCache());

      const result = await dispatch(loginWithWeChat({ code })).unwrap();

      if (result.authFlow === 'login') {
        const logsResp = await dispatch(fetchDailyLearningLogs(result.user.username)).unwrap();
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
      } else {
        router.replace('/(auth)/onboarding-wordbook' as any);
      }
    } catch (e: any) {
      const msg = e?.message || e || '微信注册失败';
      const str = String(msg);
      setFormError(str);
      if (str.includes("Cannot find native module 'ExpoNativeWechat'")) {
        Alert.alert(
          '微信登录不可用',
          '当前安装包未包含微信原生模块。\n\n请用 Development Build 运行：\n- Android: `npm run android`\n- iOS: `npm run ios`'
        );
      } else if (str.includes('SendAuthResp timed out')) {
        Alert.alert(
          '微信登录超时',
          '已发起微信授权请求，但未收到回调。\n\n请检查微信开放平台配置是否匹配当前安装包。'
        );
      }
    } finally {
      setWechatLoading(false);
    }
  };

  return (
    <>
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onAccept={handleAcceptPrivacyPolicy}
        onDecline={handleDeclinePrivacyPolicy}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header: slogan + title 仝文馆 */}
        <View style={styles.header}>
          <Text style={recipes.auth.subtitle}>VenTong —— 沉浸语境，词自成章</Text>
          <Text style={[recipes.auth.title, styles.headerTitleChinese]}>仝文馆</Text>
          <View style={recipes.auth.divider} />
        </View>

        {/* Main: form */}
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
                  placeholderTextColor={c.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* 手机号 */}
            <View style={styles.inputSection}>
              <Text style={recipes.form.inputLabel}>手机号</Text>
              <View
                style={[
                  styles.inputUnderlineWrap,
                  { borderBottomColor: phoneFocused ? c.primary : c.border },
                ]}
              >
                <RNTextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                  style={styles.inputText}
                  placeholder="+86 1XX XXXX XXXX"
                  placeholderTextColor={c.placeholder}
                  keyboardType="phone-pad"
                  maxLength={11}
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
                  placeholderTextColor={c.placeholder}
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

            {/* 确认密码 */}
            <View style={styles.inputSection}>
              <Text style={recipes.form.inputLabel}>确认密码</Text>
              <View
                style={[
                  styles.inputUnderlineWrap,
                  { borderBottomColor: verifyPasswordFocused ? c.primary : c.border },
                ]}
              >
                <RNTextInput
                  value={verifyPassword}
                  onChangeText={setVerifyPassword}
                  onFocus={() => setVerifyPasswordFocused(true)}
                  onBlur={() => setVerifyPasswordFocused(false)}
                  style={styles.inputText}
                  placeholder="••••••••"
                  placeholderTextColor={c.placeholder}
                  secureTextEntry={!showVerifyPassword}
                />
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setShowVerifyPassword((v) => !v)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showVerifyPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={c.accent}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 同意隐私政策 */}
            <View style={recipes.form.checkboxRow}>
              <Checkbox
                status={acceptedTerms ? 'checked' : 'unchecked'}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                color={c.primary}
              />
              <View style={styles.checkboxLabelWrap}>
                <Text style={recipes.form.checkboxLabel}>我已阅读并同意 </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://masterwordai.com/%E5%85%B3%E4%BA%8E%E5%85%AC%E5%8F%B8-2')}
                >
                  <Text style={recipes.form.checkboxLink}>《隐私政策》</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 发送验证码 */}
            <View style={styles.primaryButtonWrap}>
              <TouchableOpacity
                style={recipes.button.primaryCtaLarge}
                onPress={handleSmsRegister}
                disabled={smsLoading || wechatLoading}
                activeOpacity={0.9}
              >
                <Text style={recipes.button.primaryCtaLargeText}>
                  {smsLoading ? '…' : '发送验证码'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* or */}
            <View style={[recipes.form.dividerRow, styles.dividerWrap]}>
              <View style={recipes.form.dividerLine} />
              <Text style={recipes.form.dividerText}>or</Text>
              <View style={recipes.form.dividerLine} />
            </View>

            {/* 微信注册 */}
            <TouchableOpacity
              style={recipes.button.wechatOutline}
              onPress={handleWeChatRegister}
              disabled={smsLoading || wechatLoading}
              activeOpacity={0.9}
            >
              <Text style={recipes.button.wechatOutlineText}>
                {wechatLoading ? '…' : '微信注册'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={recipes.link.footerHighlight}>已有账号？去登录</Text>
          </TouchableOpacity>
          <View style={styles.footerMutedWrap}>
            <Text style={recipes.link.footerMuted}>Est. MMXXIV</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

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
  /** 仝文馆：使用中文字体完整显示，避免被截断 */
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
  checkboxLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  primaryButtonWrap: {
    marginTop: PT_4,
    marginBottom: SPACE_Y_4,
  },
  dividerWrap: {
    marginBottom: SPACE_Y_4,
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
  footerMutedWrap: {
    marginTop: PT_8,
    paddingTop: PT_8,
  },
});
