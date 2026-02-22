import { PrivacyPolicyModal } from '@/app/components/PrivacyPolicyModal';
import { safeIsWechatInstalled, safeSendWechatAuthRequest } from '@/utils/wechat';
import { SmsApi } from '@data/api/SmsApi';
import { AppDispatch } from '@data/repository/store';
import { clearDailyLearningLogsCache, fetchDailyLearningLogs, resetLogs } from '@data/usecase/DailyLearningLogsUseCase';
import { loginWithWeChat, setUser, STORAGE_KEYS } from '@data/usecase/UserUseCase';
import { usePrivacyPolicyAgreement } from '@hooks/usePrivacyPolicyAgreement';
import { useTheme } from '@hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Dimensions, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, Text, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';

const { width, height } = Dimensions.get('window');

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
  
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const router = useRouter();
  const smsApi = SmsApi.getInstance();
  const { hasAccepted: privacyPolicyAccepted, isLoading: privacyPolicyLoading, acceptPrivacyPolicy } = usePrivacyPolicyAgreement();

  // Show privacy policy modal on first app use
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
    // User declined - exit the app
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
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
        <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>注册</Text>
          <Text style={styles.subtitle}>欢迎加入仝文馆！请填写信息完成注册。</Text>
        </View>
        {formError ? (
          <Text style={styles.error}>{formError}</Text>
        ) : null}
        {/* Username Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>UserName</Text>
            <Text style={styles.labelText}>用户名</Text>
          </View>
          <TextInput
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            placeholder="请输入用户名"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Password</Text>
            <Text style={styles.labelText}>密码</Text>
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            secureTextEntry={!showPassword}
            placeholder="请输入密码，至少8位，包含字母和数字"
            placeholderTextColor="#B0B0B0"
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} />}
          />
        </View>
        {/* Verify Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Confirt Password</Text>
            <Text style={styles.labelText}>确认密码</Text>
          </View>
          <TextInput
            value={verifyPassword}
            onChangeText={setVerifyPassword}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            secureTextEntry={!showVerifyPassword}
            placeholder="请再次输入密码"
            placeholderTextColor="#B0B0B0"
            right={<TextInput.Icon icon={showVerifyPassword ? 'eye-off' : 'eye'} onPress={() => setShowVerifyPassword(v => !v)} />}
          />
        </View>
        {/* Phone Number Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>PhoneNumber</Text>
            <Text style={styles.labelText}>手机号</Text>
          </View>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder="请输入手机号"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Terms and Privacy Policy */}
        <View style={styles.termsContainer}>
          <Checkbox
            status={acceptedTerms ? 'checked' : 'unchecked'}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          />
          <TouchableOpacity onPress={() => Linking.openURL('https://masterwordai.com/%E5%85%B3%E4%BA%8E%E5%85%AC%E5%8F%B8-2')}>
            <Text style={styles.termsText}>我已阅读并同意隐私政策</Text>
          </TouchableOpacity>
        </View>
        {/* Register Button */}
        <Button
          mode="contained"
          onPress={handleSmsRegister}
          style={styles.registerButton}
          contentStyle={styles.registerButtonContent}
          labelStyle={styles.registerButtonLabel}
          loading={smsLoading}
          disabled={smsLoading}
        >
          发送验证码
        </Button>
        {/* WeChat Register Button */}
        <Button
          mode="contained"
          icon="wechat"
          onPress={handleWeChatRegister}
          style={styles.wechatButton}
          contentStyle={styles.registerButtonContent}
          labelStyle={styles.registerButtonLabel}
          loading={wechatLoading}
          disabled={smsLoading || wechatLoading}
        >
          微信注册
        </Button>
        {/* Go to Login Button */}
        <Button
          mode="text"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
          labelStyle={{ color: '#838589' }}
        >
          已有账号？去登录
        </Button>
      </View>
    </ScrollView>
    </>
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
  registerButton: {
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
  registerButtonContent: {
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.04,
  },
  registerButtonLabel: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
  },
  wechatButton: {
    backgroundColor: '#07C160',
    borderRadius: 12,
    marginBottom: height * 0.03,
    shadowColor: '#07C160',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  termsText: {
    marginLeft: 8,
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
});