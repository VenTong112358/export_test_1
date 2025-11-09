import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Platform } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { loginUser, setUser } from '@data/usecase/UserUseCase';
import { fetchDailyLearningLogs } from '@data/usecase/DailyLearningLogsUseCase';
import { useTheme } from '@hooks/useTheme';
import { RootState, AppDispatch } from '@data/repository/store';
import { useAuth } from '@hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [showTestButton, setShowTestButton] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, status } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  const router = useRouter();
  const { saveAuthToStorage } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (status === 'success' && user) {
      (async () => {
        // Only navigate to MainPage after login, do not fetch logs here
        router.replace('/(tabs)/MainPage' as any);
        setShowTestButton(true); // Show test button after login
      })();
      return;
    } else if (status === 'error') {
      const errorMessage = error || 'Login failed';
      setFormError(errorMessage);
    }
  }, [status, user, error, dispatch, router, saveAuthToStorage]);

  const handleLogin = async () => {
    if (!username || !password) {
      setFormError('Please enter your username and password');
      return;
    }
    setFormError('');
    dispatch(loginUser({ username, password }));
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome back! Log in to resume your reading journey.</Text>
        </View>
        {formError ? (
          <Text style={styles.error}>{formError}</Text>
        ) : null}
        {/* Username Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>User ID</Text>
          </View>
          <TextInput
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineStyle={styles.inputOutline}
            autoCapitalize="none"
            placeholder="Enter your username"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Password Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputLabel}>
            <Text style={styles.labelText}>Password</Text>
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
            placeholder="Enter your password"
            placeholderTextColor="#B0B0B0"
          />
        </View>
        {/* Forget Password */}
        <View style={styles.forgetPasswordContainer}>
          <Button labelStyle={{ color: '#838589' }} mode="text" onPress={() => router.push('/forgot' as any)}>
            Forgot password?
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
          disabled={loading}
        >
          Login
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
          Don't have an account? Register
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


