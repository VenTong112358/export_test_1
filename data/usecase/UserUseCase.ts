import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCredentials, UserRegistrationData, AuthResponse, User } from '@data/model/User';
import { HttpClient } from '@data/api/HttpClient';
import { SafeJsonUtils } from '@/utils/SafeJsonUtils';
import { API_CONFIG, API_ENDPOINTS } from '@data/api/ApiConfig';
import axios from 'axios';
import { resetLogs } from '@data/usecase/DailyLearningLogsUseCase';
// If you have a wordbook slice, import its clear/reset action as well:
// import { clearWordBook } from '@data/usecase/WordBookUseCase';

// 认证状态接口
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
  selectedWordBookId: number | null;
  /**
   * Used to drive post-auth navigation (e.g. WeChat can return "login" or "register").
   * - null: unknown / legacy flows
   */
  authFlow: 'login' | 'register' | null;
}

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  status: 'idle',
  isLoading: false,
  selectedWordBookId: null,
  authFlow: null,
};

// 存储键名常量
export const STORAGE_KEYS = {
  USERS: '@users',
  TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  AUTH_PERSISTENT: '@auth_persistent_data',
} as const;

// API端点常量
const API_URLS = {
  LOGIN: 'https://masterwordai.com/api/login',
  REGISTER: 'https://masterwordai.com/api/register',
  FORGOT_PASSWORD: 'https://masterwordai.com/api/password_recovery',
} as const;

// 登录载荷接口
interface LoginPayload {
  username: string;
  password: string;
}

// 注册载荷接口
interface RegisterPayload {
  username: string;
  password: string;
  phoneNumber: string;
}

// 异步操作：用户登录
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginData: LoginPayload, { rejectWithValue }) => {
    console.log('[loginUser] 发送登录请求');
    console.log('[loginUser] 载荷:', loginData);

    try {
      const httpClient = HttpClient.getInstance();
      
      const response = await httpClient.loginTest<AuthResponse>(loginData);
      console.log('[loginUser] 响应:', response);
      
      // 检查登录是否成功
      if (response.message === 'Login successful' || response.access_token) {
        // 设置tokens
        if (response.access_token) {
          console.log('🔑 设置 Tokens:', {
            access_token: response.access_token?.substring(0, 20) + '...',
            refresh_token: response.refresh_token?.substring(0, 20) + '...',
          });
          await httpClient.setTokens(response.access_token, response.refresh_token);
        }
        
        // 构建用户数据
        const userData: User = {
          id: String(response.id || response.user_id || loginData.username),
          username: response.username || response.user?.username || loginData.username,
          phoneNumber: response.user?.phoneNumber || '',
          createdAt: response.user?.createdAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          password: response.user?.password || ''
        };
        
        // 保存用户数据到本地存储
        const userDataString = SafeJsonUtils.safeStringify(userData);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, userDataString);
        
        return {
          user: userData,
          access_token: response.access_token || 'mock_token',
          message: response.message || 'Login successful'
        };
      } else {
        return rejectWithValue(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('[loginUser] 错误:', error);
      return rejectWithValue(error.message || 'Server error');
    }
  }
);

type WechatLoginStatus = 'login' | 'register';

interface WechatLoginResponse {
  status: WechatLoginStatus;
  access_token: string;
  refresh_token: string;
}

interface WechatLoginPayload {
  code: string;
}

/**
 * WeChat login:
 * - POST { code } to /login/wechat
 * - Backend returns { status: "login" | "register", access_token, refresh_token }
 */
export const loginWithWeChat = createAsyncThunk(
  'auth/loginWithWeChat',
  async ({ code }: WechatLoginPayload, { rejectWithValue }) => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.WECHAT_LOGIN}`;
      console.log('[loginWithWeChat] Request:', { url, hasCode: !!code });

      const response = await fetch(url, {
        method: 'POST',
        // Do NOT send Authorization header here (this is a login endpoint)
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json()) as Partial<WechatLoginResponse>;
      console.log('[loginWithWeChat] Response:', { ok: response.ok, status: data?.status });

      if (!response.ok) {
        return rejectWithValue((data as any)?.message || `WeChat login failed: ${response.status}`);
      }

      if (!data || (data.status !== 'login' && data.status !== 'register') || !data.access_token || !data.refresh_token) {
        return rejectWithValue('Invalid WeChat login response');
      }

      // Store tokens (HttpClient also persists them)
      const httpClient = HttpClient.getInstance();
      await httpClient.setTokens(data.access_token, data.refresh_token);

      // Create a minimal user object. We will try to infer numeric user_id from daily logs later.
      const userData: User = {
        id: '0',
        username: 'wechat_user',
        phoneNumber: '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        password: '',
      };

      // Persist user data for restoreAuthFromStorage
      const userDataString = SafeJsonUtils.safeStringify(userData);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, userDataString);

      return {
        user: userData,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        authFlow: data.status,
      };
    } catch (error: any) {
      console.error('[loginWithWeChat] Error:', error);
      return rejectWithValue(error.message || 'WeChat login failed');
    }
  }
);

// 异步操作：用户注册（本地存储版本）
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: UserRegistrationData, { rejectWithValue }) => {
    try {
      console.log('开始注册流程...');
      const usersJson = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      console.log('从存储中获取用户:', usersJson);
      
      const users: UserRegistrationData[] = usersJson ? SafeJsonUtils.safeParse(usersJson, []) : [];
      
      // 检查用户名是否已存在
      if (users.some(u => u.username === data.username)) {
        console.log('用户名已存在:', data.username);
        return rejectWithValue('该用户名已被使用，请选择其他用户名。');
      }

      // 检查手机号是否已注册
      if (users.some(u => u.phoneNumber === data.phoneNumber)) {
        console.log('手机号已注册:', data.phoneNumber);
        return rejectWithValue('该手机号已注册，请使用其他手机号。');
      }

      // 添加新用户
      const newUser = {
        ...data,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      
      // 保存到存储
      await SafeJsonUtils.safeSetItem(STORAGE_KEYS.USERS, users);
      console.log('用户保存成功');

      // 生成token
      const token = Math.random().toString(36).substring(7);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      console.log('Token生成并保存');

      return {
        user: {
          id: Math.random().toString(36).substring(2),
          username: data.username,
          phoneNumber: data.phoneNumber,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          password: data.password
        },
        token,
      };
    } catch (error) {
      console.error('注册错误:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

// 异步操作：API注册
export const registerUserApi = createAsyncThunk(
  'auth/registerUserApi',
  async (userData: RegisterPayload, { rejectWithValue }) => {
    console.log('[registerUserApi] 向后端发送注册数据:', userData);

    try {
      const response = await axios.post(API_URLS.REGISTER, userData);
      
      console.log('[registerUserApi] 收到响应:', response.data);

      if (response.data.message === 'register succeed') {
        console.log('[registerUserApi] 注册成功!');
        return response.data;
      } else {
        console.warn('[registerUserApi] 注册失败，消息:', response.data.message);
        return rejectWithValue(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        return rejectWithValue(err.response.data.message);
      } else {
        return rejectWithValue('Server error');
      }
    }
  }
);

// 异步操作：登出
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_PERSISTENT);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    // Clear tokens in HttpClient
    const httpClient = HttpClient.getInstance();
    await httpClient.clearTokensFromStorage();
    // Clear daily learning logs state
    dispatch(resetLogs());
    // Clear wordbook state (uncomment if you have this action)
    // dispatch(clearWordBook());
    // Add more clear/reset actions for other slices as needed
  }
);

// Redux Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.selectedWordBookId = null;
      state.error = null;
      state.status = 'idle';
      state.authFlow = null;
    },
    setSelectedWordBookId: (state, action: PayloadAction<number | null>) => {
      state.selectedWordBookId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
        state.authFlow = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'success';
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.error = null;
        state.authFlow = 'login';
        console.log('[loginUser.fulfilled] 设置用户:', state.user, '设置token:', state.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.status = 'error';
        state.error = action.payload as string;
        state.authFlow = null;
      })
      // WeChat 登录
      .addCase(loginWithWeChat.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
        state.authFlow = null;
      })
      .addCase(loginWithWeChat.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'success';
        state.user = action.payload.user;
        state.token = action.payload.access_token;
        state.error = null;
        state.authFlow = action.payload.authFlow;
        console.log('[loginWithWeChat.fulfilled] authFlow:', state.authFlow);
      })
      .addCase(loginWithWeChat.rejected, (state, action) => {
        state.loading = false;
        state.status = 'error';
        state.error = action.payload as string;
        state.authFlow = null;
      })
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.authFlow = 'register';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // API注册
      .addCase(registerUserApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUserApi.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // API注册成功后可能需要额外处理
      })
      .addCase(registerUserApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 登出
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
        state.status = 'idle';
        state.selectedWordBookId = null;
      });
  },
});

// 导出actions和reducer
export const { setUser, setToken, setLoading, setError, clearAuth, setSelectedWordBookId } = authSlice.actions;
export default authSlice.reducer;

// UserUseCase类 - 用于管理用户数据的本地存储
export class UserUseCase {
  private static readonly USERS_KEY = STORAGE_KEYS.USERS;

  /**
   * 获取所有用户
   */
  static async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      const users: User[] | null = SafeJsonUtils.safeParse(usersJson, null);
      
      if (users === null) {
        return [];
      }
      
      return users;
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  /**
   * 保存用户
   */
  static async saveUser(user: User): Promise<void> {
    try {
      const users = await this.getUsers();
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      await SafeJsonUtils.safeSetItem(this.USERS_KEY, users);
    } catch (error: any) {
      console.error('保存用户失败:', error);
      throw error;
    }
  }

  /**
   * 删除用户
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const users = await this.getUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      await SafeJsonUtils.safeSetItem(this.USERS_KEY, filteredUsers);
    } catch (error: any) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  /**
   * 根据用户名查找用户
   */
  static async findUserByUsername(username: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.username === username) || null;
    } catch (error: any) {
      console.error('查找用户失败:', error);
      return null;
    }
  }

  /**
   * 验证用户凭据
   */
  static async validateCredentials(credentials: UserCredentials): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => 
        u.username === credentials.username && 
        u.password === credentials.password
      ) || null;
    } catch (error: any) {
      console.error('验证用户凭据失败:', error);
      return null;
    }
  }
}