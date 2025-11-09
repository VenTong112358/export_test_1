import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SmsApi } from '@data/api/SmsApi';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setToken } from '@data/usecase/UserUseCase';
import { HttpClient } from '@data/api/HttpClient';
import { store, RootState } from '@data/repository/store';
import { API_ENDPOINTS, API_CONFIG } from '@data/api/ApiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SmsVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showTemporaryAccess, setShowTemporaryAccess] = useState(false);

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
        setError('Unknown verification purpose');
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

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>短信验证</Text>
          <Text style={styles.subtitle}>验证码已发送至 {phoneNumber}</Text>
        </View>
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>验证码</Text>
            <Text style={styles.labelText}>Verification Code</Text>
          </View>
          <TextInput
            value={verificationCode}
            onChangeText={setVerificationCode}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            keyboardType="numeric"
            maxLength={6}
            placeholder="请输入6位验证码"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
        <Button
          mode="contained"
          onPress={handleVerifyCode}
          loading={loading}
          disabled={loading || isSubmitting || hasSubmitted}
          style={styles.verifyButton}
          contentStyle={styles.verifyButtonContent}
          labelStyle={styles.verifyButtonLabel}
        >
          {hasSubmitted ? '验证成功' : (loading ? '验证中...' : '验证')}
        </Button>
        <Button
          mode="text"
          onPress={handleResendCode}
          disabled={!canResend || loading}
          style={styles.button}
          labelStyle={{ color: canResend ? theme.colors.primary : theme.colors.border }}
        >
          {canResend ? '重新发送验证码' : `重新发送 (${countdown}s)`}
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.button}
          labelStyle={{ color: theme.colors.border }}
        >
          返回
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFBF8',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.12,
    paddingTop: height * 0.20,
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
    marginBottom: height * 0.03,
  },
  inputSection: {
    marginBottom: height * 0.03,
  },
  inputLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  verifyButton: {
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
  verifyButtonContent: {
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.04,
  },
  verifyButtonLabel: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  temporaryButton: {
    marginTop: 16,
    borderColor: '#FC9B33',
    borderRadius: 8,
    minWidth: 100,
  },
  temporaryText: {
    color: '#FC9B33',
    fontSize: 14,
  },
});
