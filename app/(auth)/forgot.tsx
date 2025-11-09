import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Platform, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@data/repository/store';
import { useTheme } from '@hooks/useTheme';
import { SmsApi } from '@data/api/SmsApi';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();  
  const smsApi = SmsApi.getInstance();

  // Password validation: at least 8 chars, contains letters and numbers
  const isPasswordValid = (password: string) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };

  const handleSendCodeAndNavigate = async () => {
    setFormError('');
    if (!phoneNumber || !newPassword || !confirmPassword) {
      setFormError('请输入手机号、新密码和确认密码');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setFormError('密码必须至少8位，且包含字母和数字');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('新密码和确认密码不匹配');
      return;
    }
    setLoading(true);
    try {
      await smsApi.sendVerificationCode({ phone_number: phoneNumber, purpose: 'change_password' });
      router.replace({
        pathname: '/(auth)/sms-verification',
        params: {
          phoneNumber,
          password: newPassword,
          purpose: 'change_password',
        },
      });
    } catch (err: any) {
      setFormError(err.message || '验证码发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: '#FFFBF8' }]}>
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>重置密码</Text>
          <Text style={styles.subtitle}>Enter your username and new password to reset your password.</Text>
        </View>
        {formError ? (
          <Text style={styles.error}>{formError}</Text>
        ) : null}
        {/* Phone Number Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Phone Number</Text>
            <Text style={styles.labelText}>手机号</Text>
          </View>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            keyboardType="phone-pad"
            placeholder="请输入手机号"
          />
        </View>
        {/* New Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>New Password</Text>
            <Text style={styles.labelText}>新密码</Text>
          </View>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(v => !v)} />}
            placeholder="密码必须至少8位，且包含字母和数字"
          />
        </View>
        {/* Confirm Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Confirm Password</Text>
            <Text style={styles.labelText}>确认密码</Text>
          </View>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            secureTextEntry={!showConfirmPassword}
            right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(v => !v)} />}
          />
        </View>
        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSendCodeAndNavigate}
          style={styles.loginButton}
          contentStyle={styles.loginButtonContent}
          labelStyle={styles.loginButtonLabel}
          loading={loading}
          disabled={loading}
        >
          验证手机号
        </Button>
        <Button
          mode="text"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.link}
        >
          返回登录
        </Button>
      </View>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>重置密码成功！</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(auth)/login');
              }}
            >
              <Text style={styles.modalButtonText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C1A30',
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FC9B33',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});