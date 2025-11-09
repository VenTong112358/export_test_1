import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { SmsApi } from '@data/api/SmsApi';
import { useTheme } from '@hooks/useTheme';
import { RootState } from '@data/repository/store';

const { width, height } = Dimensions.get('window');

export default function ChangePhoneScreen() {
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { theme } = useTheme();
  const smsApi = SmsApi.getInstance();
  const { user } = useSelector((state: RootState) => state.auth);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendVerificationCode = async () => {
    setError('');
    
    if (!newPhoneNumber) {
      setError('请填写新手机号');
      return;
    }

    if (!validatePhoneNumber(newPhoneNumber)) {
      setError('请输入有效的中国手机号');
      return;
    }

    if (!user?.id) {
      setError('用户信息错误，请重新登录');
      return;
    }

    try {
      setLoading(true);
      await smsApi.sendVerificationCode({
        phone_number: newPhoneNumber, // 修改：phone -> phone_number
        purpose: 'change_phone'
      });
      
      // 跳转到短信验证页面
      router.push({
        pathname: '/(auth)/sms-verification',
        params: {
          phoneNumber: newPhoneNumber,
          purpose: 'change_phone',
          userId: user.id.toString(),
        }
      });
    } catch (error: any) {
      setError(error.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>修改手机号</Text>
          <Text style={styles.subtitle}>请输入新的手机号码，我们将发送验证码进行验证。</Text>
        </View>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
        {/* Phone Number Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>PhoneNumber</Text>
            <Text style={styles.labelText}>新手机号</Text>
          </View>
          <TextInput
            value={newPhoneNumber}
            onChangeText={setNewPhoneNumber}
            mode="outlined"
            style={styles.input}
            contentStyle={[styles.inputContent, { fontSize: 14 }]}
            outlineStyle={styles.inputOutline}
            keyboardType="phone-pad"
            maxLength={11}
            placeholder="请输入11位手机号"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Send Code Button */}
        <Button
          mode="contained"
          onPress={handleSendVerificationCode}
          style={styles.sendButton}
          contentStyle={styles.sendButtonContent}
          labelStyle={styles.sendButtonLabel}
          loading={loading}
          disabled={loading}
        >
          发送验证码
        </Button>
        {/* Go Back Button */}
        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.button}
          labelStyle={{ color: '#838589' }}
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
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
  sendButton: {
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
  sendButtonContent: {
    paddingVertical: height * 0.013,
    paddingHorizontal: width * 0.04,
  },
  sendButtonLabel: {
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
    fontSize: 14,
  },
});