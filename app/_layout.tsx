import { lightTheme } from '@constants/theme';
import { HttpClient } from '@data/api/HttpClient';
import { RootState, store } from '@data/repository/store';
import { useAuth } from '@hooks/useAuth';
import { usePrivacyPolicyAgreement } from '@hooks/usePrivacyPolicyAgreement';
import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useSelector } from 'react-redux';

function AuthWrapper() {
  const { restoreAuthFromStorage, checkTokenValidity } = useAuth();
  const { hasAccepted: privacyPolicyAccepted, isLoading: privacyPolicyLoading } = usePrivacyPolicyAgreement();
  const [isLoading, setIsLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('[AuthWrapper] Starting auth status check');
      try {
        // Wait for privacy policy check to complete
        if (privacyPolicyLoading) {
          console.log('[AuthWrapper] Waiting for privacy policy check');
          return;
        }
        // 1. Restore auth state (user info)
        const hasStoredAuth = await restoreAuthFromStorage();
        // 2. Restore tokens from storage to HttpClient
        const httpClient = HttpClient.getInstance();
        await httpClient.restoreTokensFromStorage();
        // 3. Check token validity (optional, can be removed if not needed)
        const token = httpClient.getAccessToken();
        console.log('[AuthWrapper] Auth check result:', {
          hasStoredAuth,
          hasUser: !!user,
          hasToken: !!token
        });
      } catch (error) {
        console.error('[AuthWrapper] Auth check failed:', error);
      } finally {
        setIsLoading(false);
        setHasChecked(true);
        setInitialCheckDone(true);
      }
    };
    if (!initialCheckDone && !privacyPolicyLoading) {
      checkAuthStatus();
    }
  }, [initialCheckDone, privacyPolicyLoading]);

  useEffect(() => {
    const httpClient = HttpClient.getInstance();
    const token = httpClient.getAccessToken();
    console.log('[AuthWrapper] State changed:', {
      user: !!user,
      token: !!token,
      isLoading,
      hasChecked,
      redirectPending,
      privacyPolicyAccepted,
      privacyPolicyLoading
    });
    if (!isLoading && hasChecked && !redirectPending && !privacyPolicyLoading && privacyPolicyAccepted !== null) {
      const now = Date.now();
      if (now - lastAuthCheck < 5000) {
        console.log('[AuthWrapper] Debouncing, skipping check');
        return;
      }
      // Only consider logged in if both token (from HttpClient) and user (from Redux) exist
      if (user && token) {
        console.log('[AuthWrapper] Auth success, user is logged in');
        setLastAuthCheck(now);
        return;
      }
      if (initialCheckDone && (!user || !token)) {
        console.log('[AuthWrapper] Auth failed, preparing to redirect');
        setLastAuthCheck(now);
        setRedirectPending(true);
        setTimeout(() => {
          const currentUser = store.getState().auth.user;
          const currentToken = HttpClient.getInstance().getAccessToken();
          if (!currentUser || !currentToken) {
            // Always go to register page first (default auth screen)
            console.log('[AuthWrapper] After delay, redirecting to register');
            router.replace('/(auth)/register');
          } else {
            console.log('[AuthWrapper] After delay, auth info restored, canceling redirect');
          }
          setRedirectPending(false);
        }, 3000);
      }
    }
  }, [isLoading, hasChecked, user, initialCheckDone, lastAuthCheck, redirectPending, privacyPolicyAccepted, privacyPolicyLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBF8' }}>
        <ActivityIndicator size="large" color="#FC9B33" />
      </View>
    );
  }
  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider theme={lightTheme}>
        <SafeAreaProvider>
          <AuthWrapper />
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}