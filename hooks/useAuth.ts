import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDispatch, RootState } from '@data/repository/store';
import { setUser, setToken, clearAuth } from '@data/usecase/UserUseCase';
import { HttpClient } from '@data/api/HttpClient';

const AUTH_STORAGE_KEY = '@auth_persistent_data';
const isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

interface AuthPersistentData {
  user: any;
  token: string | null;
}

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, status } = useSelector((state: RootState) => state.auth);
  const httpClient = HttpClient.getInstance();

  // 保存登录状态到本地存储
  const saveAuthToStorage = async (userData: any, authToken: string | null) => {
    try {
      const authData: AuthPersistentData = {
        user: userData,
        token: authToken,
      };
      const json = JSON.stringify(authData);
      if (isWeb) {
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, json);
        } catch (localStorageError) {
          console.warn('[useAuth] localStorage not available, falling back to AsyncStorage');
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, json);
        }
      } else {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, json);
      }
      console.log('[useAuth] Auth data saved to storage');
    } catch (error) {
      console.error('[useAuth] Error saving auth data:', error);
    }
  };

  // 从本地存储恢复登录状态
  const restoreAuthFromStorage = async (): Promise<boolean> => {
    try {
      // 1. 先恢复HttpClient的tokens
      await httpClient.restoreTokensFromStorage();
      
      // 2. 再恢复用户信息
      let authDataJson;
      if (isWeb) {
        try {
          authDataJson = localStorage.getItem(AUTH_STORAGE_KEY);
        } catch (localStorageError) {
          console.warn('[useAuth] localStorage not available, falling back to AsyncStorage');
          authDataJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        }
      } else {
        authDataJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      }
      
      if (authDataJson) {
        try {
          const authData: AuthPersistentData = JSON.parse(authDataJson);
          console.log('[useAuth] 恢复认证数据:', {
            hasUser: !!authData.user,
            hasToken: !!authData.token,
            username: authData.user?.username
          });
        
          if (authData.user && authData.token) {
            // 3. 验证token是否与HttpClient中的一致
            const httpClientToken = httpClient.getAccessToken();
            if (httpClientToken && httpClientToken === authData.token) {
              dispatch(setUser(authData.user));
              dispatch(setToken(authData.token));
              console.log('[useAuth] 认证状态恢复成功');
              return true;
            } else {
              console.warn('[useAuth] Token不一致，清除认证数据');
              await clearAuthFromStorage();
            }
          }
        } catch (parseError) {
          // console.error('[useAuth] JSON解析失败，清除损坏的认证数据:', parseError);
          await clearAuthFromStorage();
        }
      }
      
      return false;
    } catch (error) {
      console.error('[useAuth] 恢复认证数据失败:', error);
      return false;
    }
  };

  // 清除本地存储的登录状态
  const clearAuthFromStorage = async () => {
    try {
      if (isWeb) {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (localStorageError) {
          console.warn('[useAuth] localStorage not available, falling back to AsyncStorage');
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      console.log('[useAuth] Auth data cleared from storage');
    } catch (error) {
      console.error('[useAuth] Error clearing auth data:', error);
    }
  };

  // 初始化时恢复token
  const initializeAuth = async () => {
    try {
      // 从HttpClient恢复token
      await httpClient.restoreTokensFromStorage();
      
      // 从本地存储恢复用户信息
      const hasStoredAuth = await restoreAuthFromStorage();
      
      if (hasStoredAuth) {
        console.log('[useAuth] Auth state restored successfully');
      }
    } catch (error) {
      console.error('[useAuth] Failed to initialize auth:', error);
    }
  };

  // 登出时清除所有token
  const logout = async () => {
    try {
      await httpClient.clearTokensFromStorage();
      await clearAuthFromStorage();
      dispatch(clearAuth());
      console.log('[useAuth] Logout completed');
    } catch (error) {
      console.error('[useAuth] Logout error:', error);
    }
  };

  // 检查token是否有效
  const checkTokenValidity = async (): Promise<boolean> => {
    try {
      const accessToken = httpClient.getAccessToken();
      if (!accessToken) {
        console.log('[useAuth] 没有access token');
        return false;
      }
      
      // 检查Redux中的token是否与HttpClient一致
      if (token && token !== accessToken) {
        console.warn('[useAuth] Redux token与HttpClient token不一致');
        return false;
      }
      
      // 可以添加token过期检查
      // 这里可以解析JWT token检查exp字段
      
      console.log('[useAuth] Token验证通过');
      return true;
    } catch (error) {
      console.error('[useAuth] Token验证失败:', error);
      return false;
    }
  };

  // 当登录状态改变时，自动保存到本地存储
  useEffect(() => {
    if (user && token && status === 'success') {
      saveAuthToStorage(user, token);
    }
  }, [user, token, status]);

  return {
    user,
    token,
    status,
    initializeAuth,        // 初始化认证状态
    logout,               // 登出并清理token
    checkTokenValidity,   // 检查token有效性
    restoreAuthFromStorage, // 从存储恢复认证
    clearAuthFromStorage,   // 清理存储的认证数据
    saveAuthToStorage,      // 保存认证数据到存储
  };
};