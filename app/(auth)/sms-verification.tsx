import { API_CONFIG, API_ENDPOINTS } from '@data/api/ApiConfig';
import { HttpClient } from '@data/api/HttpClient';
import { SmsApi } from '@data/api/SmsApi';
import { RootState } from '@data/repository/store';
import { setUser } from '@data/usecase/UserUseCase';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { designTokensColors as c, typography as t } from '../../constants/designTokens';
import { recipes } from '../../constants/recipes';

const PX_8 = 32;
const PY_10 = 40;
const MT_8 = 32;
const MY_8 = 32;
const PB_8 = 32;
const MAX_W_SM = 384;
const SPACE_Y_4 = 16;
const PT_4 = 16;
const MT_4 = 16;
const PT_8 = 32;

export default function SmsVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showTemporaryAccess, setShowTemporaryAccess] = useState(false);
  const otpInputRef = useRef<RNTextInput>(null);

  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const smsApi = SmsApi.getInstance();
  const { saveAuthToStorage } = useAuth();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth); // Get user from Redux state

  const phoneNumber = params.phoneNumber as string;
  const purpose = params.purpose as 'register' | 'change_phone' | 'change_password';
  const password = params.password as string;
  const username = params.username as string;
  const userId = params.userId ? parseInt(params.userId as string) : undefined;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Explicit resend functions for each purpose
  const resendRegisterCode = async () => {
    await smsApi.sendVerificationCode({
      phone_number: phoneNumber,
      purpose: 'register',
    });
  };
  const resendChangePhoneCode = async () => {
    await smsApi.sendVerificationCode({
      phone_number: phoneNumber,
      purpose: 'change_phone',
    });
  };
  const resendChangePasswordCode = async () => {
    await smsApi.sendVerificationCode({
      phone_number: phoneNumber,
      purpose: 'change_password',
    });
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    try {
      setLoading(true);
      setError('');
      if (purpose === 'register') {
        await resendRegisterCode();
      } else if (purpose === 'change_phone') {
        await resendChangePhoneCode();
      } else if (purpose === 'change_password') {
        await resendChangePasswordCode();
      } else {
        setError('未知的验证用途');
        return;
      }
      setCountdown(60);
      setCanResend(false);
      Alert.alert('成功', '验证码已重新发送');
    } catch (error: any) {
      setError(error.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('请输入验证码');
      return;
    }
    if (isSubmitting || hasSubmitted) {
      return;
    }
    setIsSubmitting(true);
    setLoading(true);
    setError('');
    try {
      if (purpose === 'register') {
        // 不再生成唯一用户名，直接用params传递的username
        console.log('[SmsVerification] 开始注册流程');
        
        // 短信注册
        const response = await smsApi.smsRegister({
          phone_number: phoneNumber,
          code: verificationCode,
          password: password,
          username: username
        });
        if (response.success) {
          setHasSubmitted(true);
          
          if (response.access_token && response.refresh_token) {
            try {
              // 1. Store access_token and refresh_token in HttpClient (global and local storage)
              const httpClient = HttpClient.getInstance();
              await httpClient.setTokens(response.access_token, response.refresh_token);
              // 2. Save user object to Redux
              const userData = {
                id: String( response.user_id || username),
                username: username,
                phoneNumber: phoneNumber,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                password: password
              };
              dispatch(setUser(userData));
              console.log('[SmsVerification] setUser dispatch completed:', userData);
              // 3. Navigate to onboarding-wordbook
              setTimeout(() => {
                router.replace('/(auth)/onboarding-wordbook');
              }, 100);
            } catch (err) {
              setError('Token 存储失败，请重试');
              setHasSubmitted(false);
            }
            return;
          }
          
          
        }
      } else if (purpose === 'change_phone' && user) { // Use Redux user state
        // Call changePhoneNumber without userId, only new_phone and code
        const response = await smsApi.changePhoneNumber({
          new_phone: phoneNumber,
          code: verificationCode,
          // user_id is not needed for JWT auth
        });
        if (response.success) {
          setHasSubmitted(true);
          router.back();
        } else {
          setError(response.message || '修改手机号失败');
          setHasSubmitted(false);
        }
        return;
      } else if (purpose === 'change_password') {
        // Password recovery flow
        const response = await fetch(API_CONFIG.BASE_URL + API_ENDPOINTS.AUTH.PASSWORD_RECOVERY, {
          method: 'POST',
          headers: API_CONFIG.HEADERS,
          body: JSON.stringify({
            password: password,
            phone_number: phoneNumber,
            code: verificationCode,
          }),
        });
        const data = await response.json();
        // Password recovery flow: handle response and errors
        // Treat as success if backend returns success:true OR message contains 'recovery successful'
        if (response.ok && (data.success || (typeof data.message === 'string' && data.message.toLowerCase().includes('recovery successful')))) {
          setHasSubmitted(true);
          // Show success alert in Chinese, navigate to login on OK
          Alert.alert(
            '成功',
            '密码重置成功，请重新登录。',
            [
              {
                text: '确定',
                onPress: () => router.replace('/(auth)/login'),
              },
            ],
            { cancelable: false }
          );
        } else {
          // Log the full response and error for debugging
          console.error('[Password Recovery] Recovery failed:', {
            status: response.status,
            data,
            message: data.message,
          });
          setError(data.message || '密码重置失败, 请重试');
          setHasSubmitted(false);
        }
        return;
      }
    } catch (error: any) {
      setError(error.message || '验证失败');
      setHasSubmitted(false);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    setVerificationCode(text.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Main: form — centered, no header */}
        <View style={styles.main}>
          <View style={styles.centeredBlock}>
            <Text style={[recipes.form.smsTitle, styles.smsTitleBlock]}>输入6位短信验证码</Text>
            <Text style={[recipes.form.smsSubtitle, styles.smsSubtitleBlock]}>
              验证码已发送至您的手机 {phoneNumber}
            </Text>

            <View style={styles.otpRowWrap}>
              <View style={recipes.form.otpRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={recipes.form.otpBox}>
                    <Text style={recipes.form.otpBoxText}>
                      {verificationCode.charAt(i) || ''}
                    </Text>
                  </View>
                ))}
              </View>
              {/* Hidden input over the row: tap row to focus, type 123456 or paste, backspace removes last digit */}
              <RNTextInput
                ref={otpInputRef}
                value={verificationCode}
                onChangeText={handleOtpChange}
                style={styles.hiddenOtpOverlay}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={recipes.button.primaryCtaLarge}
              onPress={handleVerifyCode}
              disabled={loading || isSubmitting || hasSubmitted}
              activeOpacity={0.9}
            >
              <Text style={recipes.button.primaryCtaLargeText}>
                {hasSubmitted ? '验证成功' : loading ? '验证中...' : '验证并继续'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[recipes.button.resendOutline, styles.resendWrap]}
              onPress={handleResendCode}
              disabled={!canResend || loading}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  recipes.button.resendOutlineText,
                  !canResend && { color: c.textMuted },
                ]}
              >
                {canResend ? '重新发送验证码' : `重新发送 (${countdown}秒)`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.returnWrap} onPress={() => router.back()}>
              <Text style={recipes.link.smsReturn}>返回登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: PX_8,
    paddingTop: PY_10,
    paddingBottom: PB_8,
  },
  keyboardView: {
    flex: 1,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MAX_W_SM,
    alignSelf: 'center',
  },
  centeredBlock: {
    width: '100%',
  },
  smsTitleBlock: {
    marginBottom: 8,
  },
  smsSubtitleBlock: {
    marginBottom: 24,
  },
  otpRowWrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  hiddenOtpOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 16,
  },
  resendWrap: {
    marginTop: SPACE_Y_4,
  },
  returnWrap: {
    marginTop: PT_8,
    alignItems: 'center',
  },
  error: {
    color: c.textMain,
    fontSize: t.fontSize.bodyMeta,
    marginBottom: SPACE_Y_4,
    textAlign: 'center',
  },
});
