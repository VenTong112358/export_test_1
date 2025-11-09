import { API_CONFIG, API_ENDPOINTS } from './ApiConfig';
// @ts-ignore: No type definitions for crypto-js
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. 引入 Keychain
//import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 定义RequestOptions接口
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

// 加密密钥
const SECRET_KEY = 'my-very-secret-key-masteraiwords';
// 存储键名
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

/**
 * 加密数据
 * @param data 要加密的数据
 * @returns 加密后的字符串
 */
function encryptData(data: any): string {
  const json = JSON.stringify(data);
  return CryptoJS.AES.encrypt(json, SECRET_KEY).toString();
}

/**
 * 解密数据
 * @param ciphertext 加密的字符串
 * @returns 解密后的数据
 */
function decryptData(ciphertext: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted || decrypted.trim() === '') {
      throw new Error('解密结果为空');
    }
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('❌ [Decryption] Failed:', error);
    throw new Error('数据解密失败');
  }
}

/**
 * HTTP客户端类，支持JWT认证和自动token刷新
 */
export class HttpClient {
  private static instance: HttpClient;
  private accessToken: string | null = null;     // 访问令牌
  private refreshToken: string | null = null;    // 刷新令牌
  private isRefreshing: boolean = false;         // 是否正在刷新token
  private refreshPromise: Promise<string> | null = null; // 刷新Promise，避免重复刷新

  private constructor() {}

  /**
   * 获取HttpClient单例实例
   * @returns HttpClient实例
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * 设置访问令牌和刷新令牌
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌（可选）
   */
  // 在HttpClient类中添加token存储和恢复方法
  
  /**
   * 从本地存储恢复token
   */
  public async restoreTokensFromStorage(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (accessToken) {
        this.accessToken = accessToken;
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
      console.log('[HttpClient] Tokens restored from storage');
    } catch (error) {
      console.error('[HttpClient] Failed to restore tokens:', error);
    }
  }
  
  /**
   * 保存token到本地存储（跨平台安全写法）
   */
  public async saveTokensToStorage(): Promise<void> {
    try {
      if (this.accessToken) {
        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
        console.log('[HttpClient] access_token saved to AsyncStorage');
      }
      if (this.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, this.refreshToken, { keychainAccessible: SecureStore.ALWAYS });
        console.log('[HttpClient] refresh_token saved to SecureStore');
      }
      console.log('[HttpClient] Tokens saved to storage');
    } catch (error) {
      console.error('[HttpClient] Failed to save tokens:', error);
      if (error && typeof error === 'object') {
        if ('message' in error) {
          console.error('[HttpClient] Failed to save tokens - message:', (error as any).message);
        }
        if ('stack' in error) {
          console.error('[HttpClient] Failed to save tokens - stack:', (error as any).stack);
        }
        if ('code' in error) {
          console.error('[HttpClient] Failed to save tokens - code:', (error as any).code);
        }
        if ('name' in error) {
          console.error('[HttpClient] Failed to save tokens - name:', (error as any).name);
        }
        try {
          console.error('[HttpClient] Failed to save tokens - JSON:', JSON.stringify(error));
        } catch (e) {
          // ignore
        }
      }
    }
  }
  
  /**
   * 清除本地存储的token
   */
  public async clearTokensFromStorage(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      this.clearTokens();
      console.log('[HttpClient] Tokens cleared from storage');
    } catch (error) {
      console.error('[HttpClient] Failed to clear tokens:', error);
    }
  }
  
  // 修改setTokens方法，自动保存到本地存储
  // 添加主动刷新相关属性
  private tokenExpiryTime: number | null = null;
  // private refreshTimer: NodeJS.Timeout | null = null; // 删除
  
  // 解析JWT token获取过期时间
  private parseJWT(token: string): any {
    try {
      if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Missing JWT payload');
      }
      
      // 添加padding if needed
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      
      const jsonPayload = atob(base64);
      
      // 验证是否为有效JSON
      if (!jsonPayload || jsonPayload.trim() === '') {
        throw new Error('Empty JWT payload');
      }
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ [JWT Parse] Failed:', error);
      return null;
    }
  }
  
  // 修改setTokens方法，添加主动刷新调度
  public async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    
    // 解析token获取过期时间
    const payload = this.parseJWT(accessToken);
    if (payload && payload.exp) {
      this.tokenExpiryTime = payload.exp * 1000; // 转换为毫秒
      const expiryDate = new Date(this.tokenExpiryTime);
      console.log('🔑 [Token] Expiry time:', expiryDate.toLocaleString());
    }
    
    // 新增：打印 accessToken 前 20 位和 payload
    console.log('🔑 [Token] accessToken (first 20 chars):', accessToken.substring(0, 20) + '...');
    console.log('🔑 [Token] accessToken payload:', payload);
    // 自动保存到本地存储
    await this.saveTokensToStorage();
  }
  
  /**
   * 清除所有令牌
   */
  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
    
    // 清理定时器
    // if (this.refreshTimer) { // 删除
    //   clearTimeout(this.refreshTimer); // 删除
    //   this.refreshTimer = null; // 删除
    // }
    
    console.log('🧹 [Token] All tokens and timers cleared');
  }

  /**
   * 刷新访问令牌
   * 使用防重复刷新机制，确保同时只有一个刷新请求
   * @returns 新的访问令牌
   */
  public async refreshAccessToken(): Promise<string> {
    console.log('[refreshAccessToken] called!');
    
    if (this.tokenExpiryTime) {
      console.log('[refreshAccessToken] tokenExpiryTime:', new Date(this.tokenExpiryTime).toLocaleString());
    }
    console.log('[refreshAccessToken] 当前时间:', new Date().toLocaleString());
    console.log('🔄 [Token Refresh] Starting refresh process');
    console.log('🔄 [Token Refresh] Current refreshToken:', this.refreshToken ? 'exists' : 'does not exist');
    
    if (!this.refreshToken) {
      console.error('❌ [Token Refresh] Failed: No refresh token available');
      throw new Error('No refresh token available');
    }

    // 如果正在刷新，返回现有的Promise
    if (this.isRefreshing && this.refreshPromise) {
      console.log('⏳ [Token Refresh] Already refreshing, waiting for current refresh to finish');
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      console.log('✅ [Token Refresh] Got new access token:', newAccessToken.substring(0, 20) + '...');
      
      this.accessToken = newAccessToken;
      // 保存新的访问令牌到本地存储
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      console.log('✅ [Token Refresh] New token saved to local storage');
      
      return newAccessToken;
    } catch (error) {
      console.error('❌ [Token Refresh] Error during refresh:', error);
      throw error;
    } finally {
      // 重置刷新状态
      console.log('🔄 [Token Refresh] Resetting refresh state');
      this.isRefreshing = false;
      this.refreshPromise = null;
      console.log('✅ [Token Refresh] Refresh process completed');
    }
  }

  /**
   * 执行实际的token刷新请求
   * @returns 新的访问令牌
   */
  private async performTokenRefresh(): Promise<string> {
    console.log('[performTokenRefresh] called!');
    console.log('[performTokenRefresh] 当前 accessToken:', this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null');
    console.log('[performTokenRefresh] 当前 refreshToken:', this.refreshToken ? this.refreshToken.substring(0, 20) + '...' : 'null');
    if (this.tokenExpiryTime) {
      console.log('[performTokenRefresh] tokenExpiryTime:', new Date(this.tokenExpiryTime).toLocaleString());
    }
    console.log('[performTokenRefresh] 当前时间:', new Date().toLocaleString());
    const refreshUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`;
    console.log('🌐 [Token Refresh] Sending refresh request to:', refreshUrl);
    
    const startTime = Date.now();
    
    try {
      const requestBody = {
        refresh_token: this.refreshToken
      };
      const requestHeaders = {
        'Content-Type': 'application/json'
      };
      console.log('[Token Refresh] Request body:', requestBody);
      console.log('[Token Refresh] Request headers:', requestHeaders);
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`⏱️ [Token Refresh] Request duration: ${duration}ms`);
      console.log('📡 [Token Refresh] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('❌ [Token Refresh] Request failed:', {
          status: response.status,
          statusText: response.statusText,
          url: refreshUrl
        });
        // 新增：401时自动登出并提示
        if (response.status === 401) {
          await this.clearTokensFromStorage();
          // 这里可以根据你的路由实现跳转到登录页
          if (typeof window !== 'undefined') {
            alert('登录已过期，请重新登录');
            // window.location.href = '/login'; // 或用你自己的路由跳转
          }
        }
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      console.log('📥 [Token Refresh] Parsing response data...');
      const data = await response.json();
      console.log('✅ [Token Refresh] Response data:', data);

      // 新增：校验返回的access_token和refresh_token
      if (data.access_token && data.refresh_token) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        // 重新调度刷新
        const payload = this.parseJWT(data.access_token);
        if (payload && payload.exp) {
          this.tokenExpiryTime = payload.exp * 1000;
          // this.scheduleTokenRefresh(); // 删除主动调度
        }
        // 保存到本地存储
        await this.saveTokensToStorage();
        return data.access_token;
      } else {
        throw new Error('Token refresh response missing access_token or refresh_token');
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`❌ [Token Refresh] Request exception (duration: ${duration}ms):`, error);
      throw error;
    }
  }

  /**
   * 执行HTTP请求的核心方法
   * 支持自动token刷新和重试机制
   * @param endpoint API端点
   * @param options 请求选项
   * @param retryCount 重试次数（用于防止无限重试）
   * @returns 响应数据
   */
  private async request<T = any>(endpoint: string, options: RequestOptions = {}, retryCount: number = 0): Promise<T> {
    // 删除主动刷新逻辑
    // 修复URL拼接逻辑 - 确保不会重复拼接
    let url: string;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      url = endpoint;
    } else {
      const baseUrl = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      url = `${baseUrl}${path}`;
    }

    // 精简 log
    console.log('🌐 [HttpClient] Request URL:', url);

    // Build the actual headers for the request (always use full accessToken)
    const headers = {
      ...API_CONFIG.HEADERS,
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      ...options.headers,
    };
    // Build a safe log version of headers for debugging (truncate token)
    const headerLog = {
      ...API_CONFIG.HEADERS,
      ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken.substring(0, 8)}...` } : {}),
      ...options.headers,
    };
    // For logging, use headerLog
    if (headerLog.Authorization) {
      console.log('[HttpClient] Request header Authorization:', headerLog.Authorization);
    } else {
      console.log('[HttpClient] Request header no Authorization');
    }
    console.log('[HttpClient] Current this.accessToken:', this.accessToken);

    let body = options.body;
    if (body && (options.method === 'POST' || options.method === 'PUT')) {
      try {
        const parsed = JSON.parse(body as string);
        if (endpoint.includes('daily_learning_logs')) {
          // 不输出大段日志内容
          console.log('🔓 [HttpClient] daily_learning_logs request body omitted');
        } else {
          console.log('🔓 [HttpClient] Request body:', parsed);
        }
      } catch (error) {
        // 不输出原始数据
      }
    }
  
    // 临时禁用加密，直接使用原始数据
    // if (body && (options.method === 'POST' || options.method === 'PUT')) {
    //   try {
    //     console.log('🔓 临时禁用加密 - 使用原始数据:', JSON.parse(body as string));
    //   } catch (error) {
    //     console.log('🔓 临时禁用加密 - 原始数据(非JSON):', body);
    //   }
    // }
  
    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
    try {
      const method = options.method || 'GET';
      console.log('📤 [HttpClient] Sending request:', { endpoint, method, hasBody: !!body });
      // In fetch, always use the real headers
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        body,
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      // 处理token过期情况（401错误）
      if (response.status === 401 && this.refreshToken && retryCount === 0) {
        console.warn('🔐 [HttpClient] Detected 401 error, preparing to refresh token');
        try {
          // 刷新成功后，自动重试原来的请求
          await this.refreshAccessToken();
          // 🔑 关键：重新调用原来失败的API，retryCount+1防止无限重试
          return this.request<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          console.error('❌ [HttpClient] Token refresh failed:', refreshError);
          this.clearTokens();
          throw new Error('Authentication failed');
        }
      }
  
      if (!response.ok) {
        // 详细记录错误信息
        const errorText = await response.text();
        console.error('❌ [HttpClient] API request failed:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorText,
          url
        });
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      // 解析响应数据
      const responseJson = await response.json();
      // 精简响应日志
      if (endpoint.includes('daily_learning_logs')) {
        console.log('✅ [HttpClient] API response success: [daily_learning_logs] response omitted');
      } else {
        console.log('✅ [HttpClient] API response success:', { endpoint, status: response.status });
      }

      // 如果响应包含加密数据，进行解密
      if (responseJson && typeof responseJson.data === 'string') {
        return decryptData(responseJson.data);
      }
      return responseJson;
    } catch (error) {
      console.error('❌ [HttpClient] Request exception:', { endpoint, error: (error as Error).message });
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
      }
      throw error;
    }
  }

  /**
   * 发送GET请求
   * @param endpoint API端点
   * @returns 响应数据
   */
  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  /**
   * 发送POST请求
   * @param endpoint API端点
   * @param data 请求数据
   * @returns 响应数据
   */
  public async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 发送PUT请求
   * @param endpoint API端点
   * @param data 请求数据
   * @returns 响应数据
   */
  public async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 获取当前访问令牌（用于需要手动添加认证头的场景）
   * @returns 当前访问令牌
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * 发送DELETE请求
   * @param endpoint API端点
   * @param data 请求数据（可选）
   * @returns 响应数据
   */
  public async delete<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  /**
   * 登录API - 使用统一的logintest端点
   * @param credentials 登录凭据
   * @returns 登录响应数据
   */
  public async loginTest<T>(credentials: { username: string; password: string }): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
    try {
      // 使用API_ENDPOINTS配置中的LOGIN端点（已统一为/logintest）
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Login request timeout');
      }
      throw error;
    }
  }

  // 删除 scheduleTokenRefresh 方法实现
}

// 创建并导出HttpClient单例实例
export const httpClient = HttpClient.getInstance();
